const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/auth', require('./routes/auth'));

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