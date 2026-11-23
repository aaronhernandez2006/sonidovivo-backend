-- Esquema de la base de datos de AudioMax / Sonido Vivo (PostgreSQL 18, RDS).
-- Coincide con la base real: tipos, restricciones e índices.
-- Uso:  psql "host=... dbname=... user=... sslmode=require" -f db/schema.sql
-- Después carga el catálogo con db/seed.sql.

CREATE TABLE IF NOT EXISTS public.usuarios (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre        varchar(120) NOT NULL,
  email         varchar(254) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  rol           varchar(20) NOT NULL DEFAULT 'cliente',
  activo        boolean NOT NULL DEFAULT true,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT usuarios_email_normalizado CHECK (email = lower(btrim(email))),
  CONSTRAINT usuarios_rol_check CHECK (rol IN ('cliente', 'vendedor', 'admin'))
);

CREATE TABLE IF NOT EXISTS public.productos (
  codigo        varchar(30) PRIMARY KEY,
  categoria     varchar(80) NOT NULL,
  nombre        varchar(160) NOT NULL,
  marca         varchar(100),
  modelo        varchar(100),
  stock         integer NOT NULL DEFAULT 0,
  precio_clp    integer NOT NULL,
  descuento_pct smallint NOT NULL DEFAULT 0,
  imagen_url    text,
  activo        boolean NOT NULL DEFAULT true,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT productos_stock_check CHECK (stock >= 0),
  CONSTRAINT productos_precio_clp_check CHECK (precio_clp >= 0),
  CONSTRAINT productos_descuento_pct_check CHECK (descuento_pct BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS public.pedidos (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id          bigint NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  fecha               timestamptz NOT NULL DEFAULT now(),
  estado              varchar(20) NOT NULL DEFAULT 'preparacion',
  nombre_destinatario varchar(120) NOT NULL,
  direccion_entrega   text NOT NULL,
  total_clp           bigint NOT NULL DEFAULT 0,
  CONSTRAINT pedidos_estado_check CHECK (estado IN ('preparacion', 'despachado', 'entregado')),
  CONSTRAINT pedidos_total_clp_check CHECK (total_clp >= 0)
);

CREATE TABLE IF NOT EXISTS public.detalle_pedido (
  pedido_id           bigint NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  producto_codigo     varchar(30) NOT NULL REFERENCES public.productos(codigo) ON DELETE RESTRICT,
  nombre_producto     varchar(160) NOT NULL,
  cantidad            integer NOT NULL,
  precio_unitario_clp bigint NOT NULL,
  subtotal_clp        bigint GENERATED ALWAYS AS (cantidad::bigint * precio_unitario_clp) STORED,
  PRIMARY KEY (pedido_id, producto_codigo),
  CONSTRAINT detalle_pedido_cantidad_check CHECK (cantidad > 0),
  CONSTRAINT detalle_pedido_precio_unitario_clp_check CHECK (precio_unitario_clp >= 0)
);

CREATE INDEX IF NOT EXISTS pedidos_usuario_fecha_idx ON public.pedidos (usuario_id, fecha DESC);
CREATE INDEX IF NOT EXISTS detalle_producto_idx ON public.detalle_pedido (producto_codigo);
