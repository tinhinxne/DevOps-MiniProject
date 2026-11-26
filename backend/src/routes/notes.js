const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');
const { patientAutorise, noteAutorisee } = require('../lib/acces');

const router = express.Router();
router.use(requireAuth);

const TYPES = ['QUESTION', 'MEMO'];

const refuse = (res) =>
  res.status(403).json({ code: 'PATIENT_NON_AUTORISE', error: 'Patient non autorisé' });
const introuvable = (res) =>
  res.status(404).json({ code: 'NOTE_INTROUVABLE', error: 'Note introuvable' });
const erreur = (res, e, ctx) => {
  // 22P02 = identifiant qui n'est pas un UUID valide
  if (e.code === '22P02')
    return res.status(404).json({ code: 'ID_INVALIDE', error: 'Identifiant invalide' });
  console.error(`${ctx} error:`, e.message);
  res.status(500).json({ code: 'ERREUR_SERVEUR', error: 'Erreur serveur' });
};

const sortie = (n) => ({
  id: n.id,
  patientId: n.patient_id,
  rendezVousId: n.rendez_vous_id,
  type: n.type,
  contenu: n.contenu,
  fait: n.fait,
  dateCreation: n.date_creation,
});

// GET /notes?patientId=...
router.get('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const patientId = await patientAutorise(client, req.userId, req.query.patientId);
    if (!patientId) return refuse(res);
    const { rows } = await client.query(
      'SELECT * FROM note WHERE patient_id = $1 ORDER BY date_creation', [patientId]);
    res.json({ notes: rows.map(sortie) });
  } catch (e) {
    erreur(res, e, 'list notes');
  } finally {
    client.release();
  }
});

// POST /notes  { patientId, type: 'QUESTION' | 'MEMO', contenu, rendezVousId? }
router.post('/', async (req, res) => {
  const b = req.body ?? {};
  const contenu = String(b.contenu ?? '').trim().slice(0, 1000);
  if (!TYPES.includes(b.type))
    return res.status(400).json({ code: 'TYPE_INVALIDE', error: 'Type invalide' });
  if (!contenu)
    return res.status(400).json({ code: 'CONTENU_MANQUANT', error: 'Contenu requis' });

  const client = await pool.connect();
  try {
    const patientId = await patientAutorise(client, req.userId, b.patientId);
    if (!patientId) return refuse(res);

    // Une question est rattachée à un rdv : celui demandé, sinon le prochain
    let rdvId = null;
    if (b.type === 'QUESTION') {
      const r = b.rendezVousId
        ? await client.query(
            'SELECT id FROM rendez_vous WHERE id = $1 AND patient_id = $2',
            [b.rendezVousId, patientId])
        : await client.query(
            `SELECT id FROM rendez_vous
              WHERE patient_id = $1 AND date_rdv > now()
              ORDER BY date_rdv LIMIT 1`,
            [patientId]);
      rdvId = r.rows[0]?.id ?? null;
    }

    const { rows } = await client.query(
      `INSERT INTO note (patient_id, rendez_vous_id, type, contenu)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [patientId, rdvId, b.type, contenu]);
    res.status(201).json({ note: sortie(rows[0]) });
  } catch (e) {
    erreur(res, e, 'add note');
  } finally {
    client.release();
  }
});

// PATCH /notes/:id  { fait: true | false }  -> cocher / décocher une question
router.patch('/:id', async (req, res) => {
  if (typeof req.body?.fait !== 'boolean')
    return res.status(400).json({ code: 'FAIT_INVALIDE', error: 'fait doit être true ou false' });
  const client = await pool.connect();
  try {
    const n = await noteAutorisee(client, req.userId, req.params.id);
    if (!n) return introuvable(res);
    const { rows } = await client.query(
      'UPDATE note SET fait = $1 WHERE id = $2 RETURNING *', [req.body.fait, n.id]);
    res.json({ note: sortie(rows[0]) });
  } catch (e) {
    erreur(res, e, 'update note');
  } finally {
    client.release();
  }
});

// DELETE /notes/:id
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const n = await noteAutorisee(client, req.userId, req.params.id);
    if (!n) return introuvable(res);
    await client.query('DELETE FROM note WHERE id = $1', [n.id]);
    res.status(204).end();
  } catch (e) {
    erreur(res, e, 'delete note');
  } finally {
    client.release();
  }
});

module.exports = router;