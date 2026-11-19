import { Router } from 'express';
import { pool } from '../config/db.js';
import { autenticar, exigirRol } from './auth.js';

const router = Router();

const ROLES = ['cliente', 'admin'];
const COLUMNAS = 'id, nombre, email, rol, activo, creado_en';

function idValido(texto) {
  return /^\d+$/.test(texto);
}

// Listar usuarios (solo admin)
router.get('/', autenticar, exigirRol('admin'), async (_req, res) => {
  try {
    const resultado = await pool.query(`SELECT ${COLUMNAS} FROM public.usuarios ORDER BY id`);
    res.json({ usuarios: resultado.rows });
  } catch (error) {
    console.error('Error al listar usuarios:', error.message);
    res.status(500).json({ error: 'No se pudieron consultar los usuarios' });
  }
});

// Ver un usuario: el admin ve cualquiera; los demás solo su propia cuenta
router.get('/:id', autenticar, async (req, res) => {
  const { id } = req.params;
  if (!idValido(id)) return res.status(400).json({ error: 'Identificador inválido' });

  if (req.usuario.rol !== 'admin' && String(req.usuario.id) !== id) {
    return res.status(403).json({ error: 'No tienes permiso para esta acción' });
  }

  try {
    const resultado = await pool.query(`SELECT ${COLUMNAS} FROM public.usuarios WHERE id = $1`, [id]);
    if (resultado.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ usuario: resultado.rows[0] });
  } catch (error) {
    console.error('Error al consultar usuario:', error.message);
    res.status(500).json({ error: 'No se pudo consultar el usuario' });
  }
});

// Modificar usuario. Nombre y correo: la propia persona o el admin.
// Rol y estado: solo el admin.
router.patch('/:id', autenticar, async (req, res) => {
  const { id } = req.params;
  if (!idValido(id)) return res.status(400).json({ error: 'Identificador inválido' });

  const esAdmin = req.usuario.rol === 'admin';
  const esMismo = String(req.usuario.id) === id;
  if (!esAdmin && !esMismo) {
    return res.status(403).json({ error: 'No tienes permiso para esta acción' });
  }

  const cuerpo = req.body ?? {};
  if (!esAdmin && ('rol' in cuerpo || 'activo' in cuerpo)) {
    return res.status(403).json({ error: 'Solo un administrador puede cambiar rol o estado' });
  }
  if (esAdmin && esMismo && (('rol' in cuerpo && cuerpo.rol !== 'admin') || cuerpo.activo === false)) {
    return res.status(400).json({ error: 'No puedes quitarte el rol de administrador ni desactivarte' });
  }

  const campos = [];
  const valores = [];
  const agregar = (columna, valor) => {
    valores.push(valor);
    campos.push(`${columna} = $${valores.length}`);
  };

  if ('nombre' in cuerpo) {
    const nombre = String(cuerpo.nombre ?? '').trim();
    if (!nombre || nombre.length > 120) return res.status(400).json({ error: 'Nombre inválido' });
    agregar('nombre', nombre);
  }
  if ('email' in cuerpo) {
    const email = String(cuerpo.email ?? '').trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Correo inválido' });
    }
    agregar('email', email);
  }
  if ('rol' in cuerpo) {
    if (!ROLES.includes(cuerpo.rol)) return res.status(400).json({ error: 'Rol inválido' });
    agregar('rol', cuerpo.rol);
  }
  if ('activo' in cuerpo) {
    if (typeof cuerpo.activo !== 'boolean') return res.status(400).json({ error: 'Estado inválido' });
    agregar('activo', cuerpo.activo);
  }
  if (campos.length === 0) {
    return res.status(400).json({ error: 'No hay campos para modificar' });
  }

  valores.push(id);
  try {
    const resultado = await pool.query(
      `UPDATE public.usuarios SET ${campos.join(', ')} WHERE id = $${valores.length} RETURNING ${COLUMNAS}`,
      valores,
    );
    if (resultado.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ usuario: resultado.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'No se pudo actualizar con esos datos' });
    }
    console.error('Error al modificar usuario:', error.message);
    res.status(500).json({ error: 'No se pudo modificar el usuario' });
  }
});

// Eliminar = desactivar. Solo admin.
router.delete('/:id', autenticar, exigirRol('admin'), async (req, res) => {
  const { id } = req.params;
  if (!idValido(id)) return res.status(400).json({ error: 'Identificador inválido' });
  if (String(req.usuario.id) === id) {
    return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
  }

  try {
    const resultado = await pool.query(
      `UPDATE public.usuarios SET activo = FALSE WHERE id = $1 RETURNING ${COLUMNAS}`,
      [id],
    );
    if (resultado.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ usuario: resultado.rows[0] });
  } catch (error) {
    console.error('Error al desactivar usuario:', error.message);
    res.status(500).json({ error: 'No se pudo desactivar el usuario' });
  }
});

export default router;