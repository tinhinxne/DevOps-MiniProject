const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../db');

const router = express.Router();
router.use(express.urlencoded({ extended: false }));

const fail = (res, status, code, error) => res.status(status).json({ code, error });

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');

// Port 587 (STARTTLS) : le port 465 est bloqué sur certains réseaux (ex. Wi-Fi de l'université)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Petite page web affichée à l'aidant quand il clique dans l'e-mail
const page = (body) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MediTrack</title>
<style>
  body{font-family:Arial,sans-serif;background:#F3F9FD;margin:0;padding:24px;color:#0F172A}
  .card{max-width:420px;margin:40px auto;background:#fff;border-radius:16px;padding:24px;box-shadow:0 3px 12px rgba(15,23,42,.08);text-align:center}
  h1{color:#0878AA;font-size:22px;margin:0 0 16px}
  p{font-size:15px;line-height:1.5}
  button{width:100%;padding:14px;border:0;border-radius:12px;font-size:16px;font-weight:700;color:#fff;cursor:pointer;margin-top:12px}
  .ok{background:#0878AA}.no{background:#D64545}
  a{color:#0878AA;font-size:14px}
</style></head>
<body><div class="card"><h1>MediTrack</h1>${body}</div></body></html>`;

// POST /aidants/invitations  (Authorization: Bearer <token>)
// { prenom, contact, canal: 'EMAIL' | 'WHATSAPP', lien, seuil_oublis }
router.post('/invitations', async (req, res) => {
  // --- Authentification ---
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

    // Une invitation refusée peut être renvoyée : on supprime l'ancienne
    await client.query(
      `DELETE FROM proche_notifie
        WHERE patient_id = $1 AND contact = $2 AND statut = 'REFUSE'`,
      [patient_id, contactNorm]
    );

    // Anti-doublon (invitation en attente ou déjà acceptée)
    const dup = await client.query(
      'SELECT 1 FROM proche_notifie WHERE patient_id = $1 AND contact = $2',
      [patient_id, contactNorm]
    );
    if (dup.rowCount > 0) {
      await client.query('ROLLBACK');
      return fail(res, 409, 'AIDANT_DEJA_INVITE', 'Cette personne a déjà été invitée');
    }

    // Proche notifié, en attente de réponse
    const ins = await client.query(
      `INSERT INTO proche_notifie (patient_id, prenom, contact, canal, relation, statut)
       VALUES ($1, $2, $3, $4, $5, 'EN_ATTENTE')
       RETURNING token`,
      [patient_id, prenomNorm, contactNorm, canal, lien ? String(lien).slice(0, 50) : null]
    );
    const inviteToken = ins.rows[0].token;

    // Seuil d'oublis + partage activé
    await client.query(
      `INSERT INTO parametre_notif (utilisateur_id, seuil_oublis, partage_proches)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (utilisateur_id)
       DO UPDATE SET seuil_oublis = EXCLUDED.seuil_oublis, partage_proches = TRUE`,
      [userId, seuil]
    );

    // E-mail avec boutons Accepter / Refuser
    if (canal === 'EMAIL') {
      const base = `${PUBLIC_URL}/aidants/invitations/${inviteToken}`;
      const accepter = `${base}?choix=accepter`;
      const refuser = `${base}?choix=refuser`;
      try {
        await transporter.sendMail({
          from: `"MediTrack" <${process.env.MAIL_USER}>`,
          to: contactNorm,
          subject: 'Invitation à devenir aidant sur MediTrack',
          text:
            `Bonjour ${prenomNorm},\n\n` +
            `${prenomPatient} vous invite à devenir son aidant sur MediTrack, ` +
            `l'application de suivi des prises de médicaments.\n\n` +
            `Si vous acceptez, vous recevrez uniquement ses alertes (après ${seuil} oubli(s) consécutif(s)). ` +
            `Aucun compte n'est nécessaire.\n\n` +
            `Accepter : ${accepter}\n` +
            `Refuser : ${refuser}\n\nMerci !`,
          html:
            `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#0F172A">` +
            `<h2 style="color:#0878AA">MediTrack</h2>` +
            `<p>Bonjour ${esc(prenomNorm)},</p>` +
            `<p><b>${esc(prenomPatient)}</b> vous invite à devenir son aidant sur MediTrack, ` +
            `l'application de suivi des prises de médicaments.</p>` +
            `<p>Si vous acceptez, vous recevrez uniquement ses alertes (après ${seuil} oubli(s) consécutif(s)). ` +
            `Aucun compte n'est nécessaire.</p>` +
            `<p style="margin:24px 0">` +
            `<a href="${accepter}" style="background:#0878AA;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">Accepter</a> ` +
            `<a href="${refuser}" style="background:#D64545;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold;margin-left:8px">Refuser</a>` +
            `</p></div>`,
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

// GET /aidants/invitations/:token?choix=accepter|refuser  (page ouverte depuis l'e-mail, sans connexion)
// Un bouton de confirmation évite qu'une prévisualisation du mail réponde à la place de l'aidant.
router.get('/invitations/:token', async (req, res) => {
  const { token } = req.params;
  if (!UUID_REGEX.test(token)) {
    return res.status(404).send(page('<p>Lien d’invitation invalide.</p>'));
  }
  try {
    const { rows } = await pool.query(
      `SELECT pn.prenom, pn.statut, u.prenom AS prenom_patient
         FROM proche_notifie pn
         JOIN patient p ON p.id = pn.patient_id
         LEFT JOIN utilisateur u ON u.id = p.utilisateur_id
        WHERE pn.token = $1`,
      [token]
    );
    if (rows.length === 0) {
      return res.status(404).send(page('<p>Cette invitation n’existe plus.</p>'));
    }
    const inv = rows[0];
    if (inv.statut !== 'EN_ATTENTE') {
      const dit = inv.statut === 'ACCEPTE' ? 'accepté' : 'refusé';
      return res.send(page(`<p>Vous avez déjà <b>${dit}</b> cette invitation.</p>`));
    }

    const accepte = req.query.choix !== 'refuser';
    const autre = accepte ? 'refuser' : 'accepter';
    return res.send(
      page(
        `<p>Bonjour ${esc(inv.prenom)},</p>` +
          `<p><b>${esc(inv.prenom_patient || 'Une personne')}</b> vous invite à devenir son aidant.</p>` +
          `<form method="POST" action="${PUBLIC_URL}/aidants/invitations/${token}/reponse">` +
          `<input type="hidden" name="choix" value="${accepte ? 'accepter' : 'refuser'}">` +
          `<button class="${accepte ? 'ok' : 'no'}" type="submit">` +
          `${accepte ? 'Confirmer : j’accepte' : 'Confirmer : je refuse'}</button>` +
          `</form>` +
          `<p><a href="${PUBLIC_URL}/aidants/invitations/${token}?choix=${autre}">` +
          `${accepte ? 'Finalement, je refuse' : 'Finalement, j’accepte'}</a></p>`
      )
    );
  } catch (err) {
    console.error('invitation page error:', err.message);
    return res.status(500).send(page('<p>Erreur serveur, réessayez plus tard.</p>'));
  }
});

// POST /aidants/invitations/:token/reponse  (formulaire de la page ci-dessus)
router.post('/invitations/:token/reponse', async (req, res) => {
  const { token } = req.params;
  const choix = (req.body || {}).choix;
  if (!UUID_REGEX.test(token) || !['accepter', 'refuser'].includes(choix)) {
    return res.status(400).send(page('<p>Requête invalide.</p>'));
  }
  const statut = choix === 'accepter' ? 'ACCEPTE' : 'REFUSE';
  try {
    const { rowCount } = await pool.query(
      `UPDATE proche_notifie
          SET statut = $1, repondu_le = now()
        WHERE token = $2 AND statut = 'EN_ATTENTE'`,
      [statut, token]
    );
    if (rowCount === 0) {
      return res.send(page('<p>Cette invitation a déjà reçu une réponse ou n’existe plus.</p>'));
    }
    return res.send(
      page(
        statut === 'ACCEPTE'
          ? '<p>✅ Merci ! Vous recevrez désormais les alertes par e-mail.</p>'
          : '<p>Invitation refusée. Vous ne recevrez aucune alerte.</p>'
      )
    );
  } catch (err) {
    console.error('invitation reponse error:', err.message);
    return res.status(500).send(page('<p>Erreur serveur, réessayez plus tard.</p>'));
  }
});

module.exports = router;