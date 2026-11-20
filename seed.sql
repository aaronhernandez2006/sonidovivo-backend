--
-- PostgreSQL database dump
--

\restrict 2LloqzaQIFzkdAX4EphGkJZ8Q44u56ahtc5bIXgK63P1B01gURh7ABoxvV7ZCYB

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

--
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.productos (codigo, categoria, nombre, marca, modelo, stock, precio_clp, descuento_pct, imagen_url, activo, creado_en) VALUES ('GTR-001', 'Guitarras', 'Guitarra Eléctrica Stratocaster', 'Fender', 'Player Strat', 5, 450000, 15, '/img/guitarra.jpg', true, '2026-11-18 16:38:55.978568+00');
INSERT INTO public.productos (codigo, categoria, nombre, marca, modelo, stock, precio_clp, descuento_pct, imagen_url, activo, creado_en) VALUES ('MIC-001', 'Audio', 'Micrófono Wharfedale DM 5.0', 'Wharfedale', 'DM 5.0 PRO', 20, 16990, 0, '/img/micro16.jpg', true, '2026-11-18 16:38:55.978568+00');
INSERT INTO public.productos (codigo, categoria, nombre, marca, modelo, stock, precio_clp, descuento_pct, imagen_url, activo, creado_en) VALUES ('BAT-001', 'Baterías', 'Batería Electrónica', 'Pearl', 'eRoadshow', 0, 439000, 0, '/img/bateriaelectronica.jpg', true, '2026-11-18 16:38:55.978568+00');
INSERT INTO public.productos (codigo, categoria, nombre, marca, modelo, stock, precio_clp, descuento_pct, imagen_url, activo, creado_en) VALUES ('GAC-001', 'Guitarras Acústicas', 'Guitarra Acústica Dreadnought', 'Yamaha', 'F310', 12, 189900, 0, '/img/Guitarraacustica.jpg', true, '2026-11-18 16:38:55.978568+00');
INSERT INTO public.productos (codigo, categoria, nombre, marca, modelo, stock, precio_clp, descuento_pct, imagen_url, activo, creado_en) VALUES ('TEC-001', 'Teclados y Pianos', 'Teclado Sensitivo 61 Teclas', 'Casio', 'CT-X700', 6, 219900, 20, '/img/tecladosensitivo.jpg', true, '2026-11-18 16:38:55.978568+00');
INSERT INTO public.productos (codigo, categoria, nombre, marca, modelo, stock, precio_clp, descuento_pct, imagen_url, activo, creado_en) VALUES ('PED-001', 'Pedales', 'Pedal Overdrive Classic', 'Ibanez', 'Tube Screamer TS9', 10, 149900, 10, '/img/pedal.jpg', true, '2026-11-18 16:38:55.978568+00');
INSERT INTO public.productos (codigo, categoria, nombre, marca, modelo, stock, precio_clp, descuento_pct, imagen_url, activo, creado_en) VALUES ('BAJ-001', 'Bajos', 'Bajo Eléctrico 4 Cuerdas', 'Cort', 'GB Modern 4', 8, 289900, 0, '/img/bajoelectrico.jpg', true, '2026-11-18 16:38:55.978568+00');
INSERT INTO public.productos (codigo, categoria, nombre, marca, modelo, stock, precio_clp, descuento_pct, imagen_url, activo, creado_en) VALUES ('ACC-001', 'Accesorios', 'Afinador Cromático de Clip', 'Korg', 'Pitchclip 2', 24, 15900, 0, '/img/afinador.jpg', true, '2026-11-18 16:38:55.978568+00');
INSERT INTO public.productos (codigo, categoria, nombre, marca, modelo, stock, precio_clp, descuento_pct, imagen_url, activo, creado_en) VALUES ('AMP-001', 'Amplificadores', 'Amplificador para Guitarra 50W', 'Boss', 'Katana 50 MkII', 3, 329900, 25, '/img/amplificadorguitarra.jpg', true, '2026-11-18 16:38:55.978568+00');
INSERT INTO public.productos (codigo, categoria, nombre, marca, modelo, stock, precio_clp, descuento_pct, imagen_url, activo, creado_en) VALUES ('EST-001', 'Estudio y Grabación', 'Interfaz de Audio USB', 'Focusrite', 'Scarlett 2i2 Gen 4', 6, 249900, 0, '/img/interfazaudio.jpg', true, '2026-11-18 16:38:55.978568+00');


--
-- PostgreSQL database dump complete
--

\unrestrict 2LloqzaQIFzkdAX4EphGkJZ8Q44u56ahtc5bIXgK63P1B01gURh7ABoxvV7ZCYB
