import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pool } from './config/db.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ estado: 'ok' });
});

app.get('/api/db-check', async (req, res) => {
  try {
    const r = await pool.query('SELECT NOW() AS hora');
    res.json({ estado: 'ok', hora: r.rows[0].hora });
  } catch (e) {
    res.status(500).json({ estado: 'error', mensaje: e.message });
  }
});

const puerto = process.env.PORT || 3000;
app.listen(puerto, () => console.log(`API escuchando en el puerto ${puerto}`));