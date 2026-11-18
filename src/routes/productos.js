import { Router } from 'express';
import { pool } from '../config/db.js';
import { autenticar, exigirRol } from './auth.js';

const router = Router();

function leerDatos(body = {}) {
  const codigo = String(body.codigo ?? '').trim().toUpperCase();
  const categoria = String(body.categoria ?? '').trim();
  const nombre = String(body.nombre ?? '').trim();
  const marca = String(body.marca ?? '').trim();
  const modelo = String(body.modelo ?? '').trim();
  const imagen = String(body.imagen_url ?? body.imagen ?? '').trim();
  const precio = Number(body.precio_clp ?? body.precio);
  const stock = Number(body.stock);
  const descuento = Number(body.descuento_pct ?? body.descuento ?? 0);

  if (
    !categoria || categoria.length > 80 ||
    !nombre || nombre.length > 160 ||
    marca.length > 100 ||
    modelo.length > 100 ||
    imagen.length > 2000 ||
    !Number.isInteger(precio) || precio <= 0 ||
    !Number.isInteger(stock) || stock < 0 ||
    !Number.isInteger(descuento) || descuento < 0 || descuento > 100
  ) {
    return null;
  }

  return { codigo, categoria, nombre, marca, modelo, imagen, precio, stock, descuento };
}

router.get('/', async (_req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT codigo, categoria, nombre, marca, modelo,
             stock, precio_clp, descuento_pct, imagen_url
      FROM public.productos
      WHERE activo = TRUE
      ORDER BY codigo
    `);

    return res.json(resultado.rows);
  } catch (error) {
    console.error('Error al listar productos:', error.message);
    return res.status(500).json({ error: 'No se pudieron obtener los productos' });
  }
});

router.post('/', autenticar, exigirRol('admin'), async (req, res) => {
  const datos = leerDatos(req.body);

  if (!datos || !datos.codigo || datos.codigo.length > 30) {
    return res.status(400).json({ error: 'Datos de producto inválidos' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO public.productos
         (codigo, categoria, nombre, marca, modelo, stock, precio_clp,
          descuento_pct, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING codigo, categoria, nombre, marca, modelo, stock,
                 precio_clp, descuento_pct, imagen_url`,
      [
        datos.codigo, datos.categoria, datos.nombre, datos.marca || null,
        datos.modelo || null, datos.stock, datos.precio, datos.descuento,
        datos.imagen || null,
      ],
    );

    return res.status(201).json({ producto: resultado.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: `Ya existe el producto ${datos.codigo}` });
    }

    console.error('Error al crear producto:', error.message);
    return res.status(500).json({ error: 'No se pudo crear el producto' });
  }
});

router.put('/:codigo', autenticar, exigirRol('admin'), async (req, res) => {
  const codigo = String(req.params.codigo ?? '').trim().toUpperCase();
  const datos = leerDatos({ ...req.body, codigo });

  if (!datos || !codigo || codigo.length > 30) {
    return res.status(400).json({ error: 'Datos de producto inválidos' });
  }

  try {
    const resultado = await pool.query(
      `UPDATE public.productos
       SET categoria = $1, nombre = $2, marca = $3, modelo = $4,
           stock = $5, precio_clp = $6, descuento_pct = $7, imagen_url = $8
       WHERE codigo = $9 AND activo = TRUE
       RETURNING codigo, categoria, nombre, marca, modelo, stock,
                 precio_clp, descuento_pct, imagen_url`,
      [
        datos.categoria, datos.nombre, datos.marca || null, datos.modelo || null,
        datos.stock, datos.precio, datos.descuento, datos.imagen || null, codigo,
      ],
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    return res.json({ producto: resultado.rows[0] });
  } catch (error) {
    console.error('Error al actualizar producto:', error.message);
    return res.status(500).json({ error: 'No se pudo actualizar el producto' });
  }
});

router.delete('/:codigo', autenticar, exigirRol('admin'), async (req, res) => {
  const codigo = String(req.params.codigo ?? '').trim().toUpperCase();

  try {
    const resultado = await pool.query(
      `UPDATE public.productos
       SET activo = FALSE
       WHERE codigo = $1 AND activo = TRUE
       RETURNING codigo`,
      [codigo],
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    return res.json({ eliminado: true, codigo: resultado.rows[0].codigo });
  } catch (error) {
    console.error('Error al retirar producto:', error.message);
    return res.status(500).json({ error: 'No se pudo retirar el producto' });
  }
});

export default router;
