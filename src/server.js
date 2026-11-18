import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pool } from './config/db.js';
import authRoutes from './routes/auth.js';
import pedidosRoutes from './routes/pedidos.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ estado: 'ok' });
});

app.get('/api/db-check', async (req, res) => {
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

app.get('/api/productos', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT codigo, categoria, nombre, marca, modelo,
             stock, precio_clp, descuento_pct, imagen_url
      FROM public.productos
      WHERE activo = TRUE
      ORDER BY codigo
    `);

    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al listar productos:', error.message);
    res.status(500).json({
      estado: 'error',
      mensaje: 'No se pudieron obtener los productos',
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/pedidos', pedidosRoutes);

const puerto = process.env.PORT || 3000;
app.listen(puerto, () => {
  console.log(`API escuchando en el puerto ${puerto}`);
});
