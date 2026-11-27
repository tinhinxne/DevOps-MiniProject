const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const MOMENTS = ['REVEIL', 'PETIT_DEJ', 'DEJEUNER', 'DINER', 'COUCHER', 'PERSO'];
const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

const bad = (res, code, error) => res.status(400).json({ code, error });

// Le patient est autorisé si c'est le profil de l'utilisateur
// OU s'il fait partie des patients qu'il accompagne
async function patientAutorise(client, utilisateurId, patientId) {
  const { rows } = await client.query(
    `SELECT p.id FROM patient p
      WHERE p.id = $2
        AND (p.utilisateur_id = $1
             OR EXISTS (SELECT 1 FROM accompagnement a
                         WHERE a.utilisateur_id = $1 AND a.patient_id = p.id))`,
    [utilisateurId, patientId],
  );
  return rows[0]?.id ?? null;
}

router.post('/', async (req, res) => {
  const b = req.body ?? {};

  const nom = String(b.nom ?? '').trim();
  if (!nom) return bad(res, 'NOM_MANQUANT', 'Nom obligatoire');

  const rappels = Array.isArray(b.rappels) ? b.rappels : [];
  if (rappels.length === 0 ||
      !rappels.every((r) => MOMENTS.includes(r.moment) && HEURE.test(r.heure)))
    return bad(res, 'RAPPELS_INVALIDES', 'Rappels invalides');

  const duree = Number(b.dureeJours);
  const quantite = Number(b.quantite ?? 1);
  const debut = new Date(b.dateDebut);
  if (!Number.isInteger(duree) || duree < 1 || duree > 365)
    return bad(res, 'DUREE_INVALIDE', 'Durée invalide');
  if (!Number.isInteger(quantite) || quantite < 1 || quantite > 10)
    return bad(res, 'QUANTITE_INVALIDE', 'Quantité invalide');
  if (Number.isNaN(debut.getTime()))
    return bad(res, 'DATE_INVALIDE', 'Date de début invalide');

  const source = b.source === 'ORDONNANCE' ? 'ORDONNANCE' : 'MANUEL';
  const manuel = b.saisieManuelle === true;

  // Stock = boîtes × unités par boîte (calculé côté app)
  const unitesStock = Number(b.stockRestant);
  const stockRestant =
    Number.isInteger(unitesStock) && unitesStock > 0 && unitesStock <= 100000
      ? unitesStock
      : null;

  const client = await pool.connect();
  try {
    const patientId = await patientAutorise(client, req.userId, b.patientId);
    if (!patientId)
      return res.status(403).json({ code: 'PATIENT_NON_AUTORISE', error: 'Patient non autorisé' });

    await client.query('BEGIN');

    const dci = String(b.dci ?? '').trim() || null;
    const dosage = String(b.dosage ?? '').trim() || null;
    const forme = String(b.forme ?? '').trim() || null;

    // 1. médicament : réutiliser s'il existe, sinon créer
    let { rows } = await client.query(
      `SELECT id FROM medicament
        WHERE lower(nom_commercial) = lower($1)
          AND COALESCE(dosage,'') = COALESCE($2,'')
          AND COALESCE(forme,'')  = COALESCE($3,'')`,
      [nom, dosage, forme],
    );
    let medicamentId = rows[0]?.id;
    if (!medicamentId) {
      ({ rows } = await client.query(
        `INSERT INTO medicament (nom_commercial, dci, dosage, forme, saisie_manuelle)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [nom, dci, dosage, forme, manuel],
      ));
      medicamentId = rows[0].id;
    }

    // 2. traitement
    ({ rows } = await client.query(
      `INSERT INTO traitement
         (patient_id, ordonnance_id, medicament_id, source, dosage, frequence,
          duree_jours, date_debut, instruction, quantite_par_prise, stock_restant)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        patientId, b.ordonnanceId ?? null, medicamentId, source, dosage,
        String(b.frequence ?? '').trim() || null, duree,
        debut.toISOString().slice(0, 10),
        String(b.instructions ?? '').trim() || null, quantite,
        stockRestant,
      ],
    ));
    const traitement = rows[0];

    // 3. un rappel par heure
    for (const r of rappels) {
      await client.query(
        'INSERT INTO rappel (traitement_id, moment, heure) VALUES ($1,$2,$3)',
        [traitement.id, r.moment, r.heure],
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ traitement });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    if (e.code === '22P02')
      return res.status(404).json({ code: 'PATIENT_INTROUVABLE', error: 'Patient introuvable' });
    console.error('add traitement error:', e.message);
    res.status(500).json({ code: 'ERREUR_SERVEUR', error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// GET /traitements?patientId=...  → tous les traitements (avec ou sans ordonnance)
router.get('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const patientId = await patientAutorise(client, req.userId, req.query.patientId);
    if (!patientId)
      return res.status(403).json({ code: 'PATIENT_NON_AUTORISE', error: 'Patient non autorisé' });

    const { rows } = await client.query(
      `SELECT t.id, t.ordonnance_id, m.nom_commercial AS nom,
              COALESCE(t.dosage, m.dosage) AS dosage, t.frequence, t.duree_jours,
              to_char(t.date_debut, 'YYYY-MM-DD') AS date_debut,
              t.instruction, t.quantite_par_prise, t.stock_restant, t.seuil_stock_faible,
              COALESCE((SELECT json_agg(json_build_object('moment', r.moment,
                                                          'heure', left(r.heure::text, 5))
                                        ORDER BY r.heure)
                          FROM rappel r WHERE r.traitement_id = t.id), '[]'::json) AS rappels
         FROM traitement t
         JOIN medicament m ON m.id = t.medicament_id
        WHERE t.patient_id = $1
        ORDER BY t.date_debut DESC, m.nom_commercial`,
      [patientId],
    );
    res.json({
      traitements: rows.map((t) => ({
        id: t.id,
        ordonnanceId: t.ordonnance_id,
        nom: t.nom,
        dosage: t.dosage,
        frequence: t.frequence,
        dureeJours: t.duree_jours,
        dateDebut: t.date_debut,
        instructions: t.instruction,
        quantite: t.quantite_par_prise,
        stockRestant: t.stock_restant,
        seuilStockFaible: t.seuil_stock_faible,
        rappels: t.rappels,
      })),
    });
  } catch (e) {
    if (e.code === '22P02')
      return res.status(404).json({ code: 'PATIENT_INTROUVABLE', error: 'Patient introuvable' });
    console.error('list traitements error:', e.message);
    res.status(500).json({ code: 'ERREUR_SERVEUR', error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});
// Retrouve le traitement et vérifie que l'utilisateur a le droit d'y toucher
async function traitementAutorise(client, utilisateurId, traitementId) {
  const { rows } = await client.query('SELECT * FROM traitement WHERE id = $1', [traitementId]);
  const t = rows[0];
  if (!t) return { statut: 404 };
  const ok = await patientAutorise(client, utilisateurId, t.patient_id);
  return ok ? { statut: 200, traitement: t } : { statut: 403 };
}

const refus = (res, statut) =>
  statut === 403
    ? res.status(403).json({ code: 'PATIENT_NON_AUTORISE', error: 'Patient non autorisé' })
    : res.status(404).json({ code: 'TRAITEMENT_INTROUVABLE', error: 'Traitement introuvable' });

// DELETE /traitements/:id
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { statut } = await traitementAutorise(client, req.userId, req.params.id);
    if (statut !== 200) return refus(res, statut);

    await client.query('BEGIN');
    await client.query('DELETE FROM rappel WHERE traitement_id = $1', [req.params.id]);
    await client.query('DELETE FROM traitement WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    if (e.code === '22P02') return refus(res, 404);
    if (e.code === '23503')
      return res.status(409).json({
        code: 'TRAITEMENT_UTILISE',
        error: 'Ce traitement est lié à d\u2019autres données',
      });
    console.error('delete traitement error:', e.message);
    res.status(500).json({ code: 'ERREUR_SERVEUR', error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// PATCH /traitements/:id  (seuls les champs envoyés sont modifiés)
router.patch('/:id', async (req, res) => {
  const b = req.body ?? {};
  const client = await pool.connect();
  try {
    const { statut, traitement: actuel } = await traitementAutorise(
      client, req.userId, req.params.id,
    );
    if (statut !== 200) return refus(res, statut);

    const duree = b.dureeJours !== undefined ? Number(b.dureeJours) : actuel.duree_jours;
    const quantite = b.quantite !== undefined ? Number(b.quantite) : actuel.quantite_par_prise;
    if (!Number.isInteger(duree) || duree < 1 || duree > 365)
      return bad(res, 'DUREE_INVALIDE', 'Durée invalide');
    if (!Number.isInteger(quantite) || quantite < 1 || quantite > 10)
      return bad(res, 'QUANTITE_INVALIDE', 'Quantité invalide');

    let dateDebut = actuel.date_debut;
    if (b.dateDebut !== undefined) {
      const d = new Date(b.dateDebut);
      if (Number.isNaN(d.getTime())) return bad(res, 'DATE_INVALIDE', 'Date de début invalide');
      dateDebut = d.toISOString().slice(0, 10);
    }

    let stock = actuel.stock_restant;
    if (b.stockRestant !== undefined) {
      const n = Number(b.stockRestant);
      stock = b.stockRestant === null || b.stockRestant === '' ? null
        : Number.isInteger(n) && n >= 0 && n <= 100000 ? n : undefined;
      if (stock === undefined) return bad(res, 'STOCK_INVALIDE', 'Stock invalide');
    }

    const texte = (v, ancien) =>
      v === undefined ? ancien : String(v ?? '').trim() || null;

    let rappels = null;
    if (b.rappels !== undefined) {
      rappels = Array.isArray(b.rappels) ? b.rappels : [];
      if (rappels.length === 0 ||
          !rappels.every((r) => MOMENTS.includes(r.moment) && HEURE.test(r.heure)))
        return bad(res, 'RAPPELS_INVALIDES', 'Rappels invalides');
    }

    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE traitement
          SET dosage = $1, frequence = $2, duree_jours = $3, date_debut = $4,
              instruction = $5, quantite_par_prise = $6, stock_restant = $7
        WHERE id = $8
        RETURNING *`,
      [
        texte(b.dosage, actuel.dosage),
        texte(b.frequence, actuel.frequence),
        duree, dateDebut,
        texte(b.instructions, actuel.instruction),
        quantite, stock, req.params.id,
      ],
    );

    if (rappels) {
      await client.query('DELETE FROM rappel WHERE traitement_id = $1', [req.params.id]);
      for (const r of rappels) {
        await client.query(
          'INSERT INTO rappel (traitement_id, moment, heure) VALUES ($1,$2,$3)',
          [req.params.id, r.moment, r.heure],
        );
      }
    }
    await client.query('COMMIT');
    res.json({ traitement: rows[0] });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    if (e.code === '22P02') return refus(res, 404);
    console.error('patch traitement error:', e.message);
    res.status(500).json({ code: 'ERREUR_SERVEUR', error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

module.exports = router;