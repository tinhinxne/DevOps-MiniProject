const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { validatePatients, addPatientsSuivis, listPatientsSuivis } = require('../lib/patients');

const router = express.Router();
const ROLES = ['PATIENT', 'AIDANT'];

if (!process.env.JWT_SECRET) console.warn('⚠️  JWT_SECRET manquant dans les variables d’environnement');

const fail = (res, status, code, error) => res.status(status).json({ code, error });
const signToken = (id) => jwt.sign({ sub: id }, process.env.JWT_SECRET, { expiresIn: '30d' });
const publicUser = (u) => ({ id: u.id, nom_util: u.nom_util, prenom: u.prenom, email: u.email });

// Ajoute un espace (rôle) à un utilisateur.
// PATIENT -> crée aussi sa fiche patient + habitudes_repas.
async function addRole(client, user, role, nom) {
  await client.query(
    'INSERT INTO utilisateur_role (utilisateur_id, role) VALUES ($1, $2)',
    [user.id, role]
  );
  if (role === 'PATIENT') {
    const { rows } = await client.query(
      `INSERT INTO patient (utilisateur_id, nom, prenom)
       VALUES ($1, $2, $3)
       ON CONFLICT (utilisateur_id) DO NOTHING
       RETURNING id`,
      [user.id, (nom || user.prenom).trim(), user.prenom]
    );
    if (rows[0]) {
      await client.query('INSERT INTO habitudes_repas (patient_id) VALUES ($1)', [rows[0].id]);
    }
  }
}

// POST /auth/register  { nom_util, prenom, nom?, email, password, role, patients? }
//  - e-mail inconnu : crée le compte + l'espace demandé
//  - e-mail connu   : vérifie le mot de passe, ajoute SEULEMENT l'espace manquant
//  - role AIDANT    : patients = [{ nom, prenom, lien }] obligatoire
router.post('/register', async (req, res) => {
  const { nom_util, prenom, nom, email, password, role, patients } = req.body || {};

  if (!ROLES.includes(role)) return fail(res, 400, 'ROLE_INVALIDE', 'Rôle invalide');
  if (!email || !password) return fail(res, 400, 'CHAMPS_MANQUANTS', 'email et password requis');
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail(res, 400, 'EMAIL_INVALIDE', 'Email invalide');
  if (role === 'AIDANT') {
    const perr = validatePatients(patients);
    if (perr) return fail(res, 400, 'PATIENTS_INVALIDES', perr);
  }

  const emailNorm = email.trim().toLowerCase();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const found = await client.query('SELECT * FROM utilisateur WHERE email = $1', [emailNorm]);
    let user = found.rows[0];

    if (user) {
      // Compte existant : on ajoute un espace
      if (!(await bcrypt.compare(password, user.mdp_hash))) {
        await client.query('ROLLBACK');
        return fail(res, 401, 'IDENTIFIANTS_INVALIDES', 'Mot de passe incorrect pour ce compte');
      }
      const has = await client.query(
        'SELECT 1 FROM utilisateur_role WHERE utilisateur_id = $1 AND role = $2',
        [user.id, role]
      );
      if (has.rowCount > 0) {
        await client.query('ROLLBACK');
        return fail(res, 409, 'ROLE_DEJA_EXISTANT', 'Cet espace existe déjà : connectez-vous');
      }
    } else {
      // Nouveau compte
      if (!nom_util || !prenom) {
        await client.query('ROLLBACK');
        return fail(res, 400, 'CHAMPS_MANQUANTS', 'nom_util, prenom, email et password requis');
      }
      if (nom_util.length > 50) {
        await client.query('ROLLBACK');
        return fail(res, 400, 'NOM_UTIL_LONG', "Nom d'utilisateur : 50 caractères maximum");
      }
      if (password.length < 8) {
        await client.query('ROLLBACK');
        return fail(res, 400, 'MDP_COURT', 'Mot de passe : 8 caractères minimum');
      }
      const hash = await bcrypt.hash(password, 10);
      const ins = await client.query(
        `INSERT INTO utilisateur (nom_util, prenom, email, mdp_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [nom_util.trim(), prenom.trim(), emailNorm, hash]
      );
      user = ins.rows[0];
      await client.query('INSERT INTO parametre_notif (utilisateur_id) VALUES ($1)', [user.id]);
    }

    await addRole(client, user, role, nom);
    const suivis = role === 'AIDANT' ? await addPatientsSuivis(client, user.id, patients) : undefined;
    await client.query('COMMIT');
    return res.status(201).json({ token: signToken(user.id), user: publicUser(user), role, patients: suivis });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23505') {
      return fail(res, 409, 'IDENTIFIANT_PRIS', "Nom d'utilisateur ou email déjà utilisé");
    }
    console.error('register error:', err.message);
    return fail(res, 500, 'ERREUR_SERVEUR', 'Erreur serveur');
  } finally {
    client.release();
  }
});

// POST /auth/login  { identifiant (email ou nom d'utilisateur), password, role }
router.post('/login', async (req, res) => {
  const { identifiant, password, role } = req.body || {};

  if (!ROLES.includes(role)) return fail(res, 400, 'ROLE_INVALIDE', 'Rôle invalide');
  if (!identifiant || !password) {
    return fail(res, 400, 'CHAMPS_MANQUANTS', 'identifiant et password requis');
  }

  try {
    const id = identifiant.trim().toLowerCase();
    const { rows } = await pool.query(
      'SELECT * FROM utilisateur WHERE email = $1 OR lower(nom_util) = $1',
      [id]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.mdp_hash))) {
      return fail(res, 401, 'IDENTIFIANTS_INVALIDES', 'Identifiants incorrects');
    }

    const r = await pool.query('SELECT role FROM utilisateur_role WHERE utilisateur_id = $1', [user.id]);
    const roles = r.rows.map((x) => x.role);

    if (!roles.includes(role)) {
      return res.status(403).json({
        code: 'ROLE_MANQUANT',
        error: "Cet espace n'existe pas pour ces identifiants",
        roles,
      });
    }
    const patients = role === 'AIDANT' ? await listPatientsSuivis(pool, user.id) : undefined;
    return res.json({ token: signToken(user.id), user: publicUser(user), roles, role, patients });
  } catch (err) {
    console.error('login error:', err.message);
    return fail(res, 500, 'ERREUR_SERVEUR', 'Erreur serveur');
  }
});

// POST /auth/add-role  (Authorization: Bearer <token>)  { role, patients? }
// Utilisateur déjà connecté : ajoute l'espace manquant sans mot de passe.
router.post('/add-role', async (req, res) => {
  const { role, patients } = req.body || {};
  if (!ROLES.includes(role)) return fail(res, 400, 'ROLE_INVALIDE', 'Rôle invalide');
  if (role === 'AIDANT') {
    const perr = validatePatients(patients);
    if (perr) return fail(res, 400, 'PATIENTS_INVALIDES', perr);
  }

  let userId;
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    userId = jwt.verify(token, process.env.JWT_SECRET).sub;
  } catch {
    return fail(res, 401, 'TOKEN_INVALIDE', 'Session expirée');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM utilisateur WHERE id = $1', [userId]);
    const user = rows[0];
    if (!user) {
      await client.query('ROLLBACK');
      return fail(res, 401, 'TOKEN_INVALIDE', 'Session expirée');
    }
    const has = await client.query(
      'SELECT 1 FROM utilisateur_role WHERE utilisateur_id = $1 AND role = $2',
      [user.id, role]
    );
    if (has.rowCount > 0) {
      await client.query('ROLLBACK');
      return fail(res, 409, 'ROLE_DEJA_EXISTANT', 'Cet espace existe déjà : connectez-vous');
    }
    await addRole(client, user, role);
    const suivis = role === 'AIDANT' ? await addPatientsSuivis(client, user.id, patients) : undefined;
    await client.query('COMMIT');
    return res.status(201).json({ token: signToken(user.id), user: publicUser(user), role, patients: suivis });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('add-role error:', err.message);
    return fail(res, 500, 'ERREUR_SERVEUR', 'Erreur serveur');
  } finally {
    client.release();
  }
});

module.exports = router;
