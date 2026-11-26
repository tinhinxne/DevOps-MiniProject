require('dotenv').config(); // doit rester tout en haut
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '12mb' }));
app.use('/auth', require('./routes/auth'));
app.use('/patients', require('./routes/patients'));
app.use('/ordonnances', require('./routes/ordonnances'));
app.use('/traitements', require('./routes/traitements'));
app.use('/profile', require('./routes/profile'));
app.use('/aidants', require('./routes/aidants'));
app.use('/medical', require('./routes/medical'));
app.use('/rendez-vous', require('./routes/rendezVous'));
app.use('/notes', require('./routes/notes'));
app.get('/health', async (req, res) => {

  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'down' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API sur le port ${PORT}`));