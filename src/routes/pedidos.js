import { Router } from 'express';
import { pool } from '../config/db.js';
import { autenticar, exigirRol } from './auth.js';

const router = Router();

router.get('/admin', autenticar, exigirRol('admin'), async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
         p.id,
         p.fecha,
         p.estado,
         p.total_clp,
         p.nombre_destinatario,
         p.direccion_entrega,
         u.email AS usuario,
         COALESCE(
           json_agg(
             json_build_object(
               'codigo', d.producto_codigo,
               'nombre', d.nombre_producto,
               'cantidad', d.cantidad,
               'precio_unitario_clp', d.precio_unitario_clp,
               'subtotal_clp', d.subtotal_clp
             )
             ORDER BY d.producto_codigo
           ) FILTER (WHERE d.pedido_id IS NOT NULL),
           '[]'::json
         ) AS lineas
       FROM public.pedidos p
       JOIN public.usuarios u ON u.id = p.usuario_id
       LEFT JOIN public.detalle_pedido d ON d.pedido_id = p.id
       GROUP BY p.id, u.email
       ORDER BY p.fecha DESC`,
    );

    return res.json({ pedidos: resultado.rows });
  } catch (error) {
    console.error('Error al listar pedidos para administración:', error.message);
    return res.status(500).json({ error: 'No se pudieron obtener los pedidos' });
  }
});

router.patch('/:id/estado', autenticar, exigirRol('admin'), async (req, res) => {
  const id = String(req.params.id ?? '');
  const estado = String(req.body?.estado ?? '');
  const estadosPermitidos = ['preparacion', 'despachado', 'entregado'];

  if (!/^\d+$/.test(id) || !estadosPermitidos.includes(estado)) {
    return res.status(400).json({ error: 'Identificador o estado inválido' });
  }

  try {
    const resultado = await pool.query(
      `UPDATE public.pedidos
       SET estado = $1
       WHERE id = $2
       RETURNING id, fecha, estado, total_clp`,
      [estado, id],
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    return res.json({ pedido: resultado.rows[0] });
  } catch (error) {
    console.error('Error al cambiar estado del pedido:', error.message);
    return res.status(500).json({ error: 'No se pudo actualizar el pedido' });
  }
});

router.get('/mios', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
         p.id,
         p.fecha,
         p.estado,
         p.total_clp,
         p.nombre_destinatario,
         p.direccion_entrega,
         COALESCE(
           json_agg(
             json_build_object(
               'codigo', d.producto_codigo,
               'nombre', d.nombre_producto,
               'cantidad', d.cantidad,
               'precio_unitario_clp', d.precio_unitario_clp,
               'subtotal_clp', d.subtotal_clp
             )
             ORDER BY d.producto_codigo
           ) FILTER (WHERE d.pedido_id IS NOT NULL),
           '[]'::json
         ) AS lineas
       FROM public.pedidos p
       LEFT JOIN public.detalle_pedido d ON d.pedido_id = p.id
       WHERE p.usuario_id = $1
       GROUP BY p.id
       ORDER BY p.fecha DESC`,
      [req.usuario.id],
    );

    return res.json({ pedidos: resultado.rows });
  } catch (error) {
    console.error('Error al listar pedidos del usuario:', error.message);
    return res.status(500).json({ error: 'No se pudieron obtener tus pedidos' });
  }
});

router.post('/', autenticar, async (req, res) => {
  const nombre = String(req.body?.cliente?.nombre ?? '').trim();
  const direccion = String(req.body?.cliente?.direccion ?? '').trim();
  const items = req.body?.items;

  if (
    nombre.length < 1 ||
    nombre.length > 120 ||
    direccion.length < 3 ||
    direccion.length > 500 ||
    !Array.isArray(items) ||
    items.length < 1 ||
    items.length > 50
  ) {
    return res.status(400).json({ error: 'Datos de compra inválidos' });
  }

  const lineasSolicitadas = [];
  const codigosVistos = new Set();

  for (const item of items) {
    const codigo = String(item?.codigo ?? '').trim();
    const cantidad = Number(item?.cantidad);

    if (
      !codigo ||
      codigo.length > 30 ||
      !Number.isInteger(cantidad) ||
      cantidad < 1 ||
      cantidad > 99 ||
      codigosVistos.has(codigo)
    ) {
      return res.status(400).json({ error: 'Productos o cantidades inválidos' });
    }

    codigosVistos.add(codigo);
    lineasSolicitadas.push({ codigo, cantidad });
  }

  let cliente;
  let transaccionIniciada = false;

  try {
    cliente = await pool.connect();
    await cliente.query('BEGIN');
    transaccionIniciada = true;

    const codigos = lineasSolicitadas.map((linea) => linea.codigo);
    const resultadoProductos = await cliente.query(
      `SELECT codigo, nombre, stock, precio_clp, descuento_pct
       FROM public.productos
       WHERE codigo = ANY($1::varchar[]) AND activo = TRUE
       ORDER BY codigo
       FOR UPDATE`,
      [codigos],
    );

    if (resultadoProductos.rowCount !== codigos.length) {
      await cliente.query('ROLLBACK');
      transaccionIniciada = false;
      return res.status(409).json({ error: 'Uno o más productos ya no están disponibles' });
    }

    const productosPorCodigo = new Map(
      resultadoProductos.rows.map((producto) => [producto.codigo, producto]),
    );

    const lineas = [];
    let total = 0;

    for (const solicitada of lineasSolicitadas) {
      const producto = productosPorCodigo.get(solicitada.codigo);
      const stock = Number(producto.stock);

      if (stock < solicitada.cantidad) {
        await cliente.query('ROLLBACK');
        transaccionIniciada = false;
        return res.status(409).json({
          error: `Stock insuficiente para ${producto.nombre}`,
        });
      }

      const precioBase = Number(producto.precio_clp);
      const descuento = Number(producto.descuento_pct);
      const precioUnitario = Math.round(precioBase * (100 - descuento) / 100);
      const subtotal = precioUnitario * solicitada.cantidad;

      lineas.push({
        codigo: producto.codigo,
        nombre: producto.nombre,
        cantidad: solicitada.cantidad,
        precio_unitario_clp: precioUnitario,
        subtotal_clp: subtotal,
      });

      total += subtotal;
    }

    const resultadoPedido = await cliente.query(
      `INSERT INTO public.pedidos
         (usuario_id, nombre_destinatario, direccion_entrega, total_clp)
       VALUES ($1, $2, $3, $4)
       RETURNING id, fecha, estado`,
      [req.usuario.id, nombre, direccion, total],
    );

    const pedido = resultadoPedido.rows[0];

    for (const linea of lineas) {
      await cliente.query(
        `INSERT INTO public.detalle_pedido
           (pedido_id, producto_codigo, nombre_producto, cantidad, precio_unitario_clp)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          pedido.id,
          linea.codigo,
          linea.nombre,
          linea.cantidad,
          linea.precio_unitario_clp,
        ],
      );

      await cliente.query(
        `UPDATE public.productos
         SET stock = stock - $1
         WHERE codigo = $2`,
        [linea.cantidad, linea.codigo],
      );
    }

    await cliente.query('COMMIT');
    transaccionIniciada = false;

    return res.status(201).json({
      pedido: {
        id: pedido.id,
        fecha: pedido.fecha,
        estado: pedido.estado,
        total_clp: total,
        lineas,
      },
    });
  } catch (error) {
    if (cliente && transaccionIniciada) {
      await cliente.query('ROLLBACK').catch(() => {});
    }

    console.error('Error al crear pedido:', error.message);
    return res.status(500).json({ error: 'No se pudo registrar el pedido' });
  } finally {
    cliente?.release();
  }
});

export default router;
