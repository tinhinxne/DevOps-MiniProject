const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');
const { validatePatients, addPatientsSuivis, listPatientsSuivis } = require('../lib/patients');

const router = express.Router();
router.use(requireAuth);

const serverError = (res) =>
  res.status(500).json({ code: 'ERREUR_SERVEUR', error: 'Erreur serveur' });

// GET /patients/suivis : liste (inscription et après connexion)
router.get('/suivis', async (req, res) => {
  try {
    res.json({ patients: await listPatientsSuivis(pool, req.userId) });
  } catch (err) {
    console.error('list suivis error:', err.message);
    serverError(res);
  }
});

// GET /patients/suivis/:id : patient choisi (nom pour le dashboard)
router.get('/suivis/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.nom, p.prenom, a.lien
         FROM accompagnement a
         JOIN patient p ON p.id = a.patient_id
        WHERE a.utilisateur_id = $1 AND p.id = $2`,
      [req.userId, req.params.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ code: 'PATIENT_INTROUVABLE', error: 'Patient introuvable' });
    }
    res.json({ patient: rows[0] });
  } catch (err) {
    if (err.code === '22P02') { // UUID mal formé
      return res.status(404).json({ code: 'PATIENT_INTROUVABLE', error: 'Patient introuvable' });
    }
    console.error('get suivi error:', err.message);
    serverError(res);
  }
});

// POST /patients/suivis  { patients: [{ nom, prenom, lien }] }
router.post('/suivis', async (req, res) => {
  const err = validatePatients(req.body?.patients);
  if (err) return res.status(400).json({ code: 'PATIENTS_INVALIDES', error: err });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const role = await client.query(
      "SELECT 1 FROM utilisateur_role WHERE utilisateur_id = $1 AND role = 'AIDANT'",
      [req.userId]
    );
    if (role.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ code: 'ROLE_MANQUANT', error: 'Espace aidant requis' });
    }
    const created = await addPatientsSuivis(client, req.userId, req.body.patients);
    await client.query('COMMIT');
    res.status(201).json({ patients: created });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('add suivis error:', e.message);
    serverError(res);
  } finally {
    client.release();
  }
});

module.exports = router;
