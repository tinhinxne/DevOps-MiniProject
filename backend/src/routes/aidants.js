const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../db');

const router = express.Router();

const fail = (res, status, code, error) => res.status(status).json({ code, error });

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

// POST /aidants/invitations  (Authorization: Bearer <token>)
// { prenom, contact, canal: 'EMAIL' | 'WHATSAPP', lien, seuil_oublis }
// Ajoute un proche notifié (sans compte) au patient de l'utilisateur connecté.
router.post('/invitations', async (req, res) => {
  // --- Authentification (même logique que /auth/add-role) ---
  let userId;
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    userId = jwt.verify(token, process.env.JWT_SECRET).sub;
  } catch {
    return fail(res, 401, 'TOKEN_INVALIDE', 'Session expirée');
  }

  // --- Validation ---
  const { prenom, contact, canal, lien, seuil_oublis } = req.body || {};
  if (!prenom || !String(prenom).trim() || !contact || !['EMAIL', 'WHATSAPP'].includes(canal)) {
    return fail(res, 400, 'CONTACT_INVALIDE', 'prenom, contact et canal requis');
  }
  const contactNorm = canal === 'EMAIL' ? String(contact).trim().toLowerCase() : String(contact).trim();
  if (canal === 'EMAIL' && !EMAIL_REGEX.test(contactNorm)) {
    return fail(res, 400, 'CONTACT_INVALIDE', 'Adresse e-mail invalide');
  }
  if (canal === 'WHATSAPP' && !/^213[567]\d{8}$/.test(contactNorm)) {
    return fail(res, 400, 'CONTACT_INVALIDE', 'Numéro WhatsApp invalide');
  }
  const seuil = Number.isInteger(seuil_oublis) && seuil_oublis > 0 ? seuil_oublis : 3;
  const prenomNorm = String(prenom).trim();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fiche patient de l'utilisateur connecté + son prénom
    const { rows } = await client.query(
      `SELECT p.id AS patient_id, u.prenom
         FROM patient p
         JOIN utilisateur u ON u.id = p.utilisateur_id
        WHERE p.utilisateur_id = $1`,
      [userId]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return fail(res, 404, 'PATIENT_INTROUVABLE', 'Espace patient introuvable');
    }
    const { patient_id, prenom: prenomPatient } = rows[0];

    // Anti-doublon
    const dup = await client.query(
      'SELECT 1 FROM proche_notifie WHERE patient_id = $1 AND contact = $2',
      [patient_id, contactNorm]
    );
    if (dup.rowCount > 0) {
      await client.query('ROLLBACK');
      return fail(res, 409, 'AIDANT_DEJA_INVITE', 'Cette personne a déjà été invitée');
    }

    // Proche notifié
    await client.query(
      `INSERT INTO proche_notifie (patient_id, prenom, contact, canal, relation)
       VALUES ($1, $2, $3, $4, $5)`,
      [patient_id, prenomNorm, contactNorm, canal, lien ? String(lien).slice(0, 50) : null]
    );

    // Seuil d'oublis + partage activé
    await client.query(
      `INSERT INTO parametre_notif (utilisateur_id, seuil_oublis, partage_proches)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (utilisateur_id)
       DO UPDATE SET seuil_oublis = EXCLUDED.seuil_oublis, partage_proches = TRUE`,
      [userId, seuil]
    );

    // E-mail d'invitation (pour WhatsApp, c'est l'appli qui ouvre WhatsApp)
    if (canal === 'EMAIL') {
      try {
        await transporter.sendMail({
          from: `"MediTrack" <${process.env.MAIL_USER}>`,
          to: contactNorm,
          subject: 'Invitation à devenir aidant sur MediTrack',
          text:
            `Bonjour ${prenomNorm},\n\n` +
            `${prenomPatient} vous invite à devenir son aidant sur MediTrack, ` +
            `l'application de suivi des prises de médicaments.\n\n` +
            `Vous recevrez uniquement ses alertes (après ${seuil} oubli(s) consécutif(s)). ` +
            `Aucun compte n'est nécessaire.\n\nMerci !`,
        });
      } catch (mailErr) {
        console.error('invitation mail error:', mailErr.message);
        await client.query('ROLLBACK');
        return fail(res, 502, 'ENVOI_ECHOUE', "Impossible d'envoyer l'e-mail");
      }
    }

    await client.query('COMMIT');
    return res.status(201).json({ invitation: { canal } });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('invitation error:', err.message);
    return fail(res, 500, 'ERREUR_SERVEUR', 'Erreur serveur');
  } finally {
    client.release();
  }
});

module.exports = router;