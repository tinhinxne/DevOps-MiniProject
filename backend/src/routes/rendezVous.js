const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');
const { patientAutorise } = require('../lib/acces');

const router = express.Router();
router.use(requireAuth);

const refuse = (res) =>
  res.status(403).json({ code: 'PATIENT_NON_AUTORISE', error: 'Patient non autorisé' });
const bad = (res, code, error) => res.status(400).json({ code, error });
const erreur = (res, e, ctx) => {
  if (e.code === '22P02')
    return res.status(404).json({ code: 'PATIENT_INTROUVABLE', error: 'Patient introuvable' });
  console.error(`${ctx} error:`, e.message);
  res.status(500).json({ code: 'ERREUR_SERVEUR', error: 'Erreur serveur' });
};

const JOURS = ['MEME_JOUR', '1J', '2J'];
const LIBELLES = {
  MEME_JOUR: 'Le jour même',
  '1J': 'La veille',
  '2J': '2 jours avant',
};
const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

// Un rdv + le nom du médecin (jointure)
const SELECT_RDV = `
  SELECT r.*, m.nom AS medecin_nom, m.specialite
    FROM rendez_vous r LEFT JOIN medecin m ON m.id = r.medecin_id`;

const sortie = (r) => ({
  id: r.id,
  patientId: r.patient_id,
  dateRdv: r.date_rdv,
  medecin: r.medecin_nom ?? null,
  specialite: r.specialite ?? null,
  rappel: r.rappel,
  rappelJour: r.rappel_jour,
  rappelHeure: r.rappel_heure ? String(r.rappel_heure).slice(0, 5) : null,
  rappelLe: r.rappel_le,
  lieu: r.lieu,
});

// GET /rendez-vous?patientId=...  -> tous les rdv du patient, du plus proche au plus lointain
router.get('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const patientId = await patientAutorise(client, req.userId, req.query.patientId);
    if (!patientId) return refuse(res);
    const { rows } = await client.query(
      `${SELECT_RDV} WHERE r.patient_id = $1 ORDER BY r.date_rdv`, [patientId]);
    res.json({ rendezVous: rows.map(sortie) });
  } catch (e) {
    erreur(res, e, 'list rdv');
  } finally {
    client.release();
  }
});

// GET /rendez-vous/prochain?patientId=...  -> le prochain rdv à venir (pour le dashboard)
router.get('/prochain', async (req, res) => {
  const client = await pool.connect();
  try {
    const patientId = await patientAutorise(client, req.userId, req.query.patientId);
    if (!patientId) return refuse(res);
    const { rows } = await client.query(
      `${SELECT_RDV} WHERE r.patient_id = $1 AND r.date_rdv > now()
        ORDER BY r.date_rdv LIMIT 1`, [patientId]);
    res.json({ rendezVous: rows[0] ? sortie(rows[0]) : null });
  } catch (e) {
    erreur(res, e, 'prochain rdv');
  } finally {
    client.release();
  }
});

// POST /rendez-vous
// { patientId, dateRdv (ISO), medecin, specialite?, lieu?,
//   rappelJour? ('MEME_JOUR'|'1J'|'2J'), rappelHeure? ('HH:MM'), rappelLe? (ISO) }
router.post('/', async (req, res) => {
  const b = req.body ?? {};
  const date = new Date(b.dateRdv);
  const nom = String(b.medecin ?? '').trim().slice(0, 100);
  if (Number.isNaN(date.getTime())) return bad(res, 'DATE_INVALIDE', 'Date invalide');
  if (date.getTime() < Date.now() - 60000)
    return bad(res, 'DATE_PASSEE', 'La date du rendez-vous doit être dans le futur');
  if (!nom) return bad(res, 'MEDECIN_MANQUANT', 'Médecin requis');

  const specialite = String(b.specialite ?? '').trim().slice(0, 100) || null;
  const lieu = String(b.lieu ?? '').trim().slice(0, 255) || null;

  // --- Rappel (facultatif) ---
  let rappel = null; // texte lisible
  let rappelJour = null;
  let rappelHeure = null;
  let rappelLe = null;

  if (b.rappelJour) {
    if (!JOURS.includes(b.rappelJour))
      return bad(res, 'RAPPEL_INVALIDE', 'Jour du rappel invalide');
    if (!HEURE.test(String(b.rappelHeure ?? '')))
      return bad(res, 'RAPPEL_HEURE_INVALIDE', 'Heure du rappel invalide (HH:MM)');
    const quand = new Date(b.rappelLe);
    if (Number.isNaN(quand.getTime()))
      return bad(res, 'RAPPEL_DATE_INVALIDE', 'Date du rappel invalide');
    if (quand.getTime() <= Date.now())
      return bad(res, 'RAPPEL_PASSE', 'Le rappel doit être dans le futur');
    if (quand.getTime() >= date.getTime())
      return bad(res, 'RAPPEL_APRES_RDV', 'Le rappel doit être avant le rendez-vous');

    rappelJour = b.rappelJour;
    rappelHeure = b.rappelHeure;
    rappelLe = quand.toISOString();
    rappel = `${LIBELLES[rappelJour]} à ${rappelHeure}`;
  } else {
    // ancienne version de l'appli : texte libre
    rappel = String(b.rappel ?? '').trim().slice(0, 200) || null;
  }

  const client = await pool.connect();
  try {
    const patientId = await patientAutorise(client, req.userId, b.patientId);
    if (!patientId) return refuse(res);

    // Médecin : on le retrouve chez ce patient, sinon on le crée
    const found = await client.query(
      'SELECT id FROM medecin WHERE patient_id = $1 AND lower(nom) = lower($2)',
      [patientId, nom]);
    const medecinId =
      found.rows[0]?.id ??
      (await client.query(
        'INSERT INTO medecin (patient_id, nom, specialite) VALUES ($1,$2,$3) RETURNING id',
        [patientId, nom, specialite])).rows[0].id;

    const ins = await client.query(
      `INSERT INTO rendez_vous
         (patient_id, medecin_id, date_rdv, rappel, rappel_jour, rappel_heure, rappel_le, lieu)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [patientId, medecinId, date.toISOString(), rappel, rappelJour, rappelHeure, rappelLe, lieu]);

    const { rows } = await client.query(`${SELECT_RDV} WHERE r.id = $1`, [ins.rows[0].id]);
    res.status(201).json({ rendezVous: sortie(rows[0]) });
  } catch (e) {
    erreur(res, e, 'add rdv');
  } finally {
    client.release();
  }
});

module.exports = router;