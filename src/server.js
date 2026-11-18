import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ estado: 'ok' });
});

const puerto = process.env.PORT || 3000;
app.listen(puerto, () => console.log(`API escuchando en el puerto ${puerto}`));