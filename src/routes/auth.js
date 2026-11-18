import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const router = Router();
const JWT_ISSUER = 'audiomax-api';
const JWT_AUDIENCE = 'audiomax-frontend';

function crearToken(usuario) {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 64) {
    throw new Error('JWT_SECRET no está configurado correctamente');
  }

  return jwt.sign({}, secret, {
    subject: String(usuario.id),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithm: 'HS256',
  });
}

export async function autenticar(req, res, next) {
  const encabezado = req.headers.authorization || '';
  const coincidencia = encabezado.match(/^Bearer\s+(.+)$/i);

  if (!coincidencia) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  let identidad;
  try {
    identidad = jwt.verify(coincidencia[1], process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  } catch {
    return res.status(401).json({ error: 'Token inválido o vencido' });
  }

  if (!identidad || typeof identidad.sub !== 'string') {
    return res.status(401).json({ error: 'Token inválido o vencido' });
  }

  try {
    const resultado = await pool.query(
      `SELECT id, nombre, email, rol
       FROM public.usuarios
       WHERE id = $1 AND activo = TRUE`,
      [identidad.sub],
    );

    if (resultado.rowCount === 0) {
      return res.status(401).json({ error: 'Token inválido o vencido' });
    }

    req.usuario = resultado.rows[0];
    next();
  } catch (error) {
    console.error('Error al validar usuario:', error.message);
    res.status(500).json({ error: 'No se pudo validar la sesión' });
  }
}

router.post('/register', async (req, res) => {
  const nombre = String(req.body?.nombre ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const bytesPassword = Buffer.byteLength(password, 'utf8');

  if (
    !nombre ||
    nombre.length > 120 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    bytesPassword < 8 ||
    bytesPassword > 72
  ) {
    return res.status(400).json({
      error: 'Revisa nombre, correo y contraseña. La contraseña debe tener entre 8 y 72 bytes.',
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const resultado = await pool.query(
      `INSERT INTO public.usuarios (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, 'cliente')
       RETURNING id, nombre, email, rol`,
      [nombre, email, passwordHash],
    );

    return res.status(201).json({ usuario: resultado.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'No se pudo crear la cuenta con esos datos' });
    }

    console.error('Error al registrar usuario:', error.message);
    return res.status(500).json({ error: 'No se pudo registrar el usuario' });
  }
});

router.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (!email || !password || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'Correo o contraseña inválidos' });
  }

  try {
    const resultado = await pool.query(
      `SELECT id, nombre, email, password_hash, rol, activo
       FROM public.usuarios
       WHERE email = $1`,
      [email],
    );

    const usuario = resultado.rows[0];

    if (
      !usuario ||
      !usuario.activo ||
      !(await bcrypt.compare(password, usuario.password_hash))
    ) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    const accessToken = crearToken(usuario);

    return res.json({
      accessToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error.message);
    return res.status(500).json({ error: 'No se pudo iniciar sesión' });
  }
});

router.get('/me', autenticar, (req, res) => {
  res.json({ usuario: req.usuario });
});

export default router;
