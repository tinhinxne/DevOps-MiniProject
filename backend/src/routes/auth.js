const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { nom_util, prenom, nom, email, password } = req.body || {};

  if (!nom_util || !prenom || !email || !password) {
    return res.status(400).json({ error: 'nom_util, prenom, email et password requis' });
  }
  if (nom_util.length > 50) {
    return res.status(400).json({ error: "Nom d'utilisateur : 50 caractères maximum" });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Mot de passe : 8 caractères minimum' });
  }

  const client = await pool.connect();
  try {
    const hash = await bcrypt.hash(password, 10);
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO utilisateur (nom_util, prenom, email, mdp_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nom_util, prenom, email, created_at`,
      [nom_util.trim(), prenom.trim(), email.trim().toLowerCase(), hash]
    );
    const user = rows[0];

    await client.query(
      'INSERT INTO parametre_notif (utilisateur_id) VALUES ($1)',
      [user.id]
    );

    await client.query(
      `INSERT INTO patient (utilisateur_id, nom, prenom)
       VALUES ($1, $2, $3)`,
      [user.id, (nom || prenom).trim(), prenom.trim()]
    );

    await client.query('COMMIT');
    res.status(201).json(user);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: "Nom d'utilisateur ou email déjà utilisé" });
    }
    console.error('register error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

module.exports = router;