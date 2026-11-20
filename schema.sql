--
-- PostgreSQL database dump
--

\restrict aPa6p6y5I6nZXH2yAgemLSEEoKQK0Z91FhlYerZxZWY3U9oe43fSeYJHZikumLn

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: detalle_pedido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle_pedido (
    pedido_id bigint NOT NULL,
    producto_codigo character varying(30) NOT NULL,
    nombre_producto character varying(160) NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario_clp bigint NOT NULL,
    subtotal_clp bigint GENERATED ALWAYS AS (((cantidad)::bigint * precio_unitario_clp)) STORED,
    CONSTRAINT detalle_pedido_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT detalle_pedido_precio_unitario_clp_check CHECK ((precio_unitario_clp >= 0))
);


--
-- Name: pedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pedidos (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    estado character varying(20) DEFAULT 'preparacion'::character varying NOT NULL,
    nombre_destinatario character varying(120) NOT NULL,
    direccion_entrega text NOT NULL,
    total_clp bigint DEFAULT 0 NOT NULL,
    CONSTRAINT pedidos_estado_check CHECK (((estado)::text = ANY ((ARRAY['preparacion'::character varying, 'despachado'::character varying, 'entregado'::character varying])::text[]))),
    CONSTRAINT pedidos_total_clp_check CHECK ((total_clp >= 0))
);


--
-- Name: pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.pedidos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.pedidos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: productos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.productos (
    codigo character varying(30) NOT NULL,
    categoria character varying(80) NOT NULL,
    nombre character varying(160) NOT NULL,
    marca character varying(100),
    modelo character varying(100),
    stock integer DEFAULT 0 NOT NULL,
    precio_clp integer NOT NULL,
    descuento_pct smallint DEFAULT 0 NOT NULL,
    imagen_url text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT productos_descuento_pct_check CHECK (((descuento_pct >= 0) AND (descuento_pct <= 100))),
    CONSTRAINT productos_precio_clp_check CHECK ((precio_clp >= 0)),
    CONSTRAINT productos_stock_check CHECK ((stock >= 0))
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id bigint NOT NULL,
    nombre character varying(120) NOT NULL,
    email character varying(254) NOT NULL,
    password_hash text NOT NULL,
    rol character varying(20) DEFAULT 'cliente'::character varying NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT usuarios_email_normalizado CHECK (((email)::text = lower(btrim((email)::text)))),
    CONSTRAINT usuarios_rol_check CHECK (((rol)::text = ANY ((ARRAY['cliente'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.usuarios ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: detalle_pedido detalle_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_pkey PRIMARY KEY (pedido_id, producto_codigo);


--
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (codigo);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: detalle_producto_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX detalle_producto_idx ON public.detalle_pedido USING btree (producto_codigo);


--
-- Name: pedidos_usuario_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pedidos_usuario_fecha_idx ON public.pedidos USING btree (usuario_id, fecha DESC);


--
-- Name: detalle_pedido detalle_pedido_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- Name: detalle_pedido detalle_pedido_producto_codigo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_producto_codigo_fkey FOREIGN KEY (producto_codigo) REFERENCES public.productos(codigo) ON DELETE RESTRICT;


--
-- Name: pedidos pedidos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict aPa6p6y5I6nZXH2yAgemLSEEoKQK0Z91FhlYerZxZWY3U9oe43fSeYJHZikumLn
