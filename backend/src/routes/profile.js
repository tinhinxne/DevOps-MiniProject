const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const fail = (res, status, code, error) => res.status(status).json({ code, error });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function readProfile(db, userId) {
  const { rows } = await db.query(
    `SELECT u.id, u.nom_util, u.prenom, u.email,
            p.nom, p.telephone,
            to_char(p.date_naissance, 'YYYY-MM-DD') AS date_naissance
       FROM utilisateur u
       LEFT JOIN patient p ON p.utilisateur_id = u.id
      WHERE u.id = $1`,
    [userId]
  );
  if (!rows[0]) return undefined;
  const r = await db.query('SELECT role FROM utilisateur_role WHERE utilisateur_id = $1', [userId]);
  return { ...rows[0], roles: r.rows.map((x) => x.role) };
}

// GET /profile
router.get('/', async (req, res) => {
  try {
    const profile = await readProfile(pool, req.userId);
    if (!profile) return fail(res, 401, 'TOKEN_INVALIDE', 'Session expirée');
    res.json({ profile });
  } catch (err) {
    console.error('get profile error:', err.message);
    fail(res, 500, 'ERREUR_SERVEUR', 'Erreur serveur');
  }
});

// PUT /profile
router.put('/', async (req, res) => {
  const { nom_util, prenom, nom, email, telephone, date_naissance } = req.body || {};

  if (!prenom || !prenom.trim()) return fail(res, 400, 'CHAMPS_MANQUANTS', 'Prénom requis');
  if (!email || !EMAIL_RE.test(email.trim())) return fail(res, 400, 'EMAIL_INVALIDE', 'Email invalide');
  if (nom_util && (nom_util.trim().length < 3 || nom_util.trim().length > 50)) {
    return fail(res, 400, 'NOM_UTIL_INVALIDE', "Nom d'utilisateur : 3 à 50 caractères");
  }
  if (date_naissance && !DATE_RE.test(date_naissance)) {
    return fail(res, 400, 'DATE_INVALIDE', 'Date de naissance invalide');
  }

  const prenomClean = prenom.trim();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE utilisateur
          SET nom_util = COALESCE($2, nom_util), prenom = $3, email = $4
        WHERE id = $1`,
      [req.userId, nom_util ? nom_util.trim() : null, prenomClean, email.trim().toLowerCase()]
    );
    await client.query(
      `UPDATE patient
          SET nom = $2, prenom = $3, telephone = $4, date_naissance = $5
        WHERE utilisateur_id = $1`,
      [req.userId, (nom || '').trim() || prenomClean, prenomClean, telephone?.trim() || null, date_naissance || null]
    );
    await client.query('COMMIT');
    res.json({ profile: await readProfile(pool, req.userId) });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23505') return fail(res, 409, 'IDENTIFIANT_PRIS', "Nom d'utilisateur ou email déjà utilisé");
    if (err.code === '22007' || err.code === '22008') return fail(res, 400, 'DATE_INVALIDE', 'Date de naissance invalide');
    console.error('update profile error:', err.message);
    fail(res, 500, 'ERREUR_SERVEUR', 'Erreur serveur');
  } finally {
    client.release();
  }
});

module.exports = router;