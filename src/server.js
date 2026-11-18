import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pool } from './config/db.js';
import authRoutes from './routes/auth.js';
import pedidosRoutes from './routes/pedidos.js';
import productosRoutes from './routes/productos.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ estado: 'ok' });
});

app.get('/api/db-check', async (_req, res) => {
  try {
    const resultado = await pool.query('SELECT NOW() AS hora');
    res.json({ estado: 'ok', hora: resultado.rows[0].hora });
  } catch (error) {
    console.error('Error al comprobar la base de datos:', error.message);
    res.status(500).json({
      estado: 'error',
      mensaje: 'No se pudo conectar con la base de datos',
    });
  }
});

app.use('/api/productos', productosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pedidos', pedidosRoutes);

const puerto = process.env.PORT || 3000;
app.listen(puerto, () => {
  console.log(`API escuchando en el puerto ${puerto}`);
});
