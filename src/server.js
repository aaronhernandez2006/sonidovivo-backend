import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import openapiSpec from './openapi.json' with { type: 'json' };
import { pool } from './config/db.js';
import authRoutes from './routes/auth.js';
import pedidosRoutes from './routes/pedidos.js';
import productosRoutes from './routes/productos.js';

const app = express();

app.use(helmet());
const corsOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
}));
app.use(express.json());

app.get('/api/openapi.json', (_req, res) => {
  res.json(openapiSpec);
});

app.use(
  '/api/docs',
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
  }),
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, { swaggerOptions: { persistAuthorization: false } }),
);

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
