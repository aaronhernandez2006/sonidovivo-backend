require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: (process.env.CORS_ORIGINS || '').split(',') }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ estado: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API escuchando en el puerto ${PORT}`);
});
