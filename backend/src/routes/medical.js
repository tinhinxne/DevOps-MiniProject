const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

const fail = (res, status, code, error) => res.status(status).json({ code, error });
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// Authentifie l'utilisateur et trouve le patient visé :
//  - sans ?personId : sa propre fiche patient
//  - avec ?personId : une personne qu'il accompagne (table accompagnement)
async function withPatient(req, res, next) {
  let userId;
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    userId = jwt.verify(token, process.env.JWT_SECRET).sub;
  } catch {
    return fail(res, 401, 'TOKEN_INVALIDE', 'Session expirée');
  }

  try {
    const personId = req.query.personId;
    if (personId) {
      const { rows } = await pool.query(
        'SELECT 1 FROM accompagnement WHERE utilisateur_id = $1 AND patient_id = $2',
        [userId, personId]
      );
      if (rows.length === 0) return fail(res, 403, 'ACCES_REFUSE', 'Personne non accompagnée');
      req.patientId = personId;
    } else {
      const { rows } = await pool.query('SELECT id FROM patient WHERE utilisateur_id = $1', [userId]);
      if (rows.length === 0) {
        return fail(res, 404, 'PATIENT_INTROUVABLE', 'Espace patient introuvable');
      }
      req.patientId = rows[0].id;
    }
    next();
  } catch (err) {
    if (err.code === '22P02') return fail(res, 400, 'ID_INVALIDE', 'Identifiant invalide');
    console.error('medical auth error:', err.message);
    return fail(res, 500, 'ERREUR_SERVEUR', 'Erreur serveur');
  }
}

const textOrNull = (v, max) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim().slice(0, max);
  return s.length ? s : null;
};

// GET /medical[?personId=...]
router.get('/', withPatient, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.nom, p.prenom, p.maladies_chroniques, p.allergies,
              to_char(h.reveil, 'HH24:MI')         AS reveil,
              to_char(h.petit_dejeuner, 'HH24:MI') AS petit_dejeuner,
              to_char(h.dejeuner, 'HH24:MI')       AS dejeuner,
              to_char(h.diner, 'HH24:MI')          AS diner,
              to_char(h.coucher, 'HH24:MI')        AS coucher
         FROM patient p
         LEFT JOIN habitudes_repas h ON h.patient_id = p.id
        WHERE p.id = $1`,
      [req.patientId]
    );
    const r = rows[0];
    const meds = await pool.query(
      'SELECT id, nom, specialite FROM medecin WHERE patient_id = $1 ORDER BY nom',
      [req.patientId]
    );
    return res.json({
      profile: {
        person: { prenom: r.prenom, nom: r.nom },
        maladies_chroniques: r.maladies_chroniques,
        allergies: r.allergies,
        habitudes: {
          reveil: r.reveil,
          petit_dejeuner: r.petit_dejeuner,
          dejeuner: r.dejeuner,
          diner: r.diner,
          coucher: r.coucher,
        },
        medecins: meds.rows,
      },
    });
  } catch (err) {
    console.error('medical get error:', err.message);
    return fail(res, 500, 'ERREUR_SERVEUR', 'Erreur serveur');
  }
});

// PUT /medical[?personId=...]  { maladies_chroniques, allergies, habitudes: {...} }
router.put('/', withPatient, async (req, res) => {
  const { maladies_chroniques, allergies, habitudes } = req.body || {};
  const h = habitudes || {};

  const keys = ['reveil', 'petit_dejeuner', 'dejeuner', 'diner', 'coucher'];
  const times = {};
  for (const k of keys) {
    const v = h[k];
    if (v === null || v === undefined || v === '') {
      times[k] = null;
    } else if (typeof v === 'string' && TIME_REGEX.test(v)) {
      times[k] = v;
    } else {
      return fail(res, 400, 'HEURE_INVALIDE', `Heure invalide (${k}), format HH:MM`);
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE patient SET maladies_chroniques = $1, allergies = $2 WHERE id = $3', [
      textOrNull(maladies_chroniques, 1000),
      textOrNull(allergies, 1000),
      req.patientId,
    ]);
    await client.query(
      `INSERT INTO habitudes_repas (patient_id, reveil, petit_dejeuner, dejeuner, diner, coucher)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (patient_id) DO UPDATE SET
         reveil = EXCLUDED.reveil,
         petit_dejeuner = EXCLUDED.petit_dejeuner,
         dejeuner = EXCLUDED.dejeuner,
         diner = EXCLUDED.diner,
         coucher = EXCLUDED.coucher`,
      [req.patientId, times.reveil, times.petit_dejeuner, times.dejeuner, times.diner, times.coucher]
    );
    await client.query('COMMIT');
    return res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('medical put error:', err.message);
    return fail(res, 500, 'ERREUR_SERVEUR', 'Erreur serveur');
  } finally {
    client.release();
  }
});

// POST /medical/medecins[?personId=...]  { nom, specialite? }
router.post('/medecins', withPatient, async (req, res) => {
  const nom = textOrNull(req.body?.nom, 100);
  const specialite = textOrNull(req.body?.specialite, 100);
  if (!nom) return fail(res, 400, 'NOM_REQUIS', 'Nom du médecin requis');

  try {
    const { rows } = await pool.query(
      `INSERT INTO medecin (patient_id, nom, specialite)
       VALUES ($1, $2, $3)
       RETURNING id, nom, specialite`,
      [req.patientId, nom, specialite]
    );
    return res.status(201).json({ medecin: rows[0] });
  } catch (err) {
    console.error('medecin add error:', err.message);
    return fail(res, 500, 'ERREUR_SERVEUR', 'Erreur serveur');
  }
});

// DELETE /medical/medecins/:id[?personId=...]
router.delete('/medecins/:id', withPatient, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM medecin WHERE id = $1 AND patient_id = $2', [
      req.params.id,
      req.patientId,
    ]);
    if (r.rowCount === 0) return fail(res, 404, 'MEDECIN_INTROUVABLE', 'Médecin introuvable');
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === '22P02') return fail(res, 400, 'ID_INVALIDE', 'Identifiant invalide');
    console.error('medecin delete error:', err.message);
    return fail(res, 500, 'ERREUR_SERVEUR', 'Erreur serveur');
  }
});

module.exports = router;