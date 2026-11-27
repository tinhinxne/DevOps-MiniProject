const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const pool = require('../db');
const requireAuth = require('../middleware/auth');
const { patientAutorise, ordonnanceAutorisee } = require('../lib/acces');

const router = express.Router();
router.use(requireAuth);

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads/ordonnances');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const bad = (res, code, error) => res.status(400).json({ code, error });
const notFound = (res) => res.status(404).json({ code: 'ORDONNANCE_INTROUVABLE', error: 'Ordonnance introuvable' });

// photo_url en BDD = nom du fichier ; le client utilise /ordonnances/:id/photo
const sortie = (o) => ({
  id: o.id,
  patientId: o.patient_id,
  dateEmission: o.date_emission,
  dateExpiration: o.date_expiration,
  photoUrl: `/ordonnances/${o.id}/photo`,
  titre: o.titre,
note: o.note,
 medecinId: o.medecin_id ?? null,
  medecinNom: o.medecin_nom ?? null,
});

function lireImage(b64) {
  const buf = Buffer.from(String(b64 ?? '').replace(/^data:image\/\w+;base64,/, ''), 'base64');
  if (buf.length < 100) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return { buf, ext: 'jpg' };
  if (buf[0] === 0x89 && buf[1] === 0x50) return { buf, ext: 'png' };
  return null;
}

// Créer : { patientId, imageBase64, dateEmission?, dateExpiration? }
router.post('/', express.json({ limit: '12mb' }), async (req, res) => {
  const b = req.body ?? {};
  const img = lireImage(b.imageBase64);
  if (!img) return bad(res, 'IMAGE_INVALIDE', 'Image invalide (JPEG ou PNG)');

  const emission = b.dateEmission || null;
  const expiration = b.dateExpiration || null;
  if ((emission && !DATE.test(emission)) || (expiration && !DATE.test(expiration)))
    return bad(res, 'DATE_INVALIDE', 'Date invalide (AAAA-MM-JJ)');
  if (emission && expiration && expiration < emission)
    return bad(res, 'DATES_INCOHERENTES', 'Expiration avant émission');
  if (!UUID.test(String(b.medecinId ?? '')))
    return bad(res, 'MEDECIN_REQUIS', 'Médecin requis');

  const client = await pool.connect();
  const titre = String(b.titre ?? '').trim().slice(0, 100) || null;
const note = String(b.note ?? '').trim().slice(0, 500) || null;

  let fichier;
  try {
    const patientId = await patientAutorise(client, req.userId, b.patientId);
    if (!patientId)
      return res.status(403).json({ code: 'PATIENT_NON_AUTORISE', error: 'Patient non autorisé' });
        const med = await client.query(
      'SELECT 1 FROM medecin WHERE id = $1 AND patient_id = $2',
      [b.medecinId, patientId],
    );
    if (med.rowCount === 0)
      return bad(res, 'MEDECIN_INVALIDE', 'Médecin introuvable pour ce patient');

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    fichier = `${crypto.randomUUID()}.${img.ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, fichier), img.buf);

     const { rows } = await client.query(
      `INSERT INTO ordonnance (patient_id, date_emission, date_expiration, photo_url, titre, note, medecin_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [patientId, emission, expiration, fichier, titre, note, b.medecinId],
    );
    
    res.status(201).json({ ordonnance: sortie(rows[0]) });
  } catch (e) {
    if (fichier) await fs.unlink(path.join(UPLOAD_DIR, fichier)).catch(() => {});
    if (e.code === '22P02')
      return res.status(404).json({ code: 'PATIENT_INTROUVABLE', error: 'Patient introuvable' });
    console.error('add ordonnance error:', e.message);
    res.status(500).json({ code: 'ERREUR_SERVEUR', error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// Liste : GET /ordonnances?patientId=...
router.get('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const patientId = await patientAutorise(client, req.userId, req.query.patientId);
    if (!patientId)
      return res.status(403).json({ code: 'PATIENT_NON_AUTORISE', error: 'Patient non autorisé' });
    const { rows } = await client.query(
           `SELECT o.*, m.nom AS medecin_nom,
              (SELECT count(*) FROM traitement t WHERE t.ordonnance_id = o.id)::int AS nb_medicaments
         FROM ordonnance o
         LEFT JOIN medecin m ON m.id = o.medecin_id
        WHERE o.patient_id = $1
        ORDER BY o.date_emission DESC NULLS LAST, o.id`,
      [patientId],
    );
    res.json({ ordonnances: rows.map((o) => ({ ...sortie(o), nbMedicaments: o.nb_medicaments })) });
  } catch (e) {
    if (e.code === '22P02') return res.status(404).json({ code: 'PATIENT_INTROUVABLE', error: 'Patient introuvable' });
    console.error('list ordonnances error:', e.message);
    res.status(500).json({ code: 'ERREUR_SERVEUR', error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// Photo (protégée) : <Image source={{ uri, headers: { Authorization: `Bearer ${token}` } }} />
router.get('/:id/photo', async (req, res) => {
  const client = await pool.connect();
  try {
    const o = await ordonnanceAutorisee(client, req.userId, req.params.id);
    if (!o) return notFound(res);
    res.sendFile(path.resolve(UPLOAD_DIR, o.photo_url), (err) => {
      if (err && !res.headersSent) notFound(res);
    });
  } catch (e) {
    if (e.code === '22P02') return notFound(res);
    res.status(500).json({ code: 'ERREUR_SERVEUR', error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// Détail : ordonnance + médicaments liés
router.get('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const o = await ordonnanceAutorisee(client, req.userId, req.params.id);
    if (!o) return notFound(res);
    const { rows } = await client.query(
      `SELECT t.id, t.dosage, t.frequence, t.duree_jours, t.date_debut, m.nom_commercial
         FROM traitement t JOIN medicament m ON m.id = t.medicament_id
        WHERE t.ordonnance_id = $1 ORDER BY t.date_debut DESC`,
      [o.id],
    );
    res.json({ ordonnance: sortie(o), traitements: rows });
  } catch (e) {
    if (e.code === '22P02') return notFound(res);
    console.error('get ordonnance error:', e.message);
    res.status(500).json({ code: 'ERREUR_SERVEUR', error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// Supprimer : la photo part, les traitements restent (ordonnance_id passe à NULL)
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const o = await ordonnanceAutorisee(client, req.userId, req.params.id);
    if (!o) return notFound(res);
    await client.query('DELETE FROM ordonnance WHERE id = $1', [o.id]);
    await fs.unlink(path.join(UPLOAD_DIR, o.photo_url)).catch(() => {});
    res.status(204).end();
  } catch (e) {
    if (e.code === '22P02') return notFound(res);
    console.error('delete ordonnance error:', e.message);
    res.status(500).json({ code: 'ERREUR_SERVEUR', error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

module.exports = router;