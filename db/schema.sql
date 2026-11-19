CREATE TABLE IF NOT EXISTS public.usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.productos (
  codigo VARCHAR(30) PRIMARY KEY,
  categoria VARCHAR(80) NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  precio_clp INTEGER NOT NULL CHECK (precio_clp > 0),
  descuento_pct INTEGER NOT NULL DEFAULT 0 CHECK (descuento_pct BETWEEN 0 AND 100),
  imagen_url VARCHAR(2000),
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.pedidos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id),
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado VARCHAR(20) NOT NULL DEFAULT 'preparacion' CHECK (estado IN ('preparacion', 'despachado', 'entregado')),
  nombre_destinatario VARCHAR(120) NOT NULL,
  direccion_entrega VARCHAR(500) NOT NULL,
  total_clp INTEGER NOT NULL CHECK (total_clp >= 0)
);

CREATE TABLE IF NOT EXISTS public.detalle_pedido (
  pedido_id INTEGER NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  producto_codigo VARCHAR(30) NOT NULL REFERENCES public.productos(codigo),
  nombre_producto VARCHAR(160) NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario_clp INTEGER NOT NULL CHECK (precio_unitario_clp >= 0),
  subtotal_clp INTEGER GENERATED ALWAYS AS (cantidad * precio_unitario_clp) STORED,
  PRIMARY KEY (pedido_id, producto_codigo)
);
