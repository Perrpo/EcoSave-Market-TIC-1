-- ============================================================
-- EcoSave Market — Seed: Ubicaciones de Supermercados y ONGs
-- Ejecutar directamente en el SQL Editor de Supabase
-- Área: Medellín y Área Metropolitana, Colombia
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- SUPERMERCADOS
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.locations (nombre, tipo, direccion, especialidades, lat, lng) VALUES

('Éxito El Poblado',
 'supermercado',
 'Av. El Poblado #43B-10, El Poblado, Medellín',
 '["Lácteos", "Panadería", "Frutas y verduras", "Carnes", "Bebidas"]',
 6.2086, -75.5658),

('Éxito Laureles',
 'supermercado',
 'Cra. 80 #39-40, Laureles, Medellín',
 '["Alimentos secos", "Lácteos", "Snacks", "Bebidas", "Carnes"]',
 6.2413, -75.5896),

('Jumbo Mayorca',
 'supermercado',
 'Cra. 48 #16Sur-90, Sabaneta, Antioquia',
 '["Frutas y verduras", "Carnes", "Lácteos", "Panadería", "Alimentos secos"]',
 6.1499, -75.6166),

('Carulla Envigado',
 'supermercado',
 'Cl. 34 Sur #43C-15, Envigado, Antioquia',
 '["Lácteos", "Panadería", "Bebidas", "Alimentos secos", "Snacks"]',
 6.1691, -75.5899),

('D1 Bello Centro',
 'supermercado',
 'Cra. 52 #50-12, Centro, Bello, Antioquia',
 '["Alimentos secos", "Snacks", "Bebidas", "Lácteos"]',
 6.3372, -75.5565),

('Surtimax Itagüí',
 'supermercado',
 'Cra. 52 #55-39, Itagüí, Antioquia',
 '["Carnes", "Frutas y verduras", "Alimentos secos", "Bebidas"]',
 6.1849, -75.5992),

('Ara Robledo',
 'supermercado',
 'Cra. 80 #65-12, Robledo, Medellín',
 '["Alimentos secos", "Lácteos", "Snacks", "Bebidas"]',
 6.2851, -75.6001),

('Olímpica San Antonio',
 'supermercado',
 'Cl. 44 #52-165, El Centro, Medellín',
 '["Panadería", "Lácteos", "Frutas y verduras", "Carnes", "Bebidas"]',
 6.2459, -75.5679),

('Éxito Bello',
 'supermercado',
 'Cra. 52 #52-01, Bello, Antioquia',
 '["Lácteos", "Carnes", "Alimentos secos", "Panadería", "Snacks"]',
 6.3355, -75.5546),

('PriceSmart Medellín',
 'supermercado',
 'Cra. 43A #18-200, El Poblado, Medellín',
 '["Alimentos secos", "Lácteos", "Snacks", "Carnes", "Bebidas"]',
 6.2012, -75.5721);


-- ──────────────────────────────────────────────────────────────
-- ONGs / ORGANIZACIONES SOCIALES
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.locations (nombre, tipo, direccion, especialidades, lat, lng) VALUES

('Banco de Alimentos de Medellín',
 'ong',
 'Cra. 65 #98-50, Castilla, Medellín',
 '["Alimentos secos", "Lácteos", "Frutas y verduras", "Enlatados"]',
 6.3028, -75.5837),

('Fundación Buen Samaritano',
 'ong',
 'Cl. 10 #37-15, Buenos Aires, Medellín',
 '["Frutas y verduras", "Panadería", "Carnes", "Bebidas"]',
 6.2195, -75.5551),

('Corporación Casas de la Memoria',
 'ong',
 'Cl. 51 #36-66, El Centro, Medellín',
 '["Alimentos secos", "Lácteos", "Enlatados"]',
 6.2478, -75.5631),

('Fundación Amor y Fe',
 'ong',
 'Cra. 8 #44-22, San Javier, Medellín',
 '["Panadería", "Lácteos", "Frutas y verduras"]',
 6.2607, -75.6128),

('ONG Tejiendo Futuro',
 'ong',
 'Cl. 98 #69-10, Castilla, Medellín',
 '["Alimentos secos", "Carnes", "Bebidas", "Snacks"]',
 6.2994, -75.5879),

('Fundación Crecer en Familia',
 'ong',
 'Cra. 42 #25-40, Guayabal, Medellín',
 '["Frutas y verduras", "Lácteos", "Enlatados", "Panadería"]',
 6.2122, -75.5895),

('Corporación Nuevos Horizontes',
 'ong',
 'Cl. 107 #52A-45, Robledo, Medellín',
 '["Alimentos secos", "Lácteos", "Carnes"]',
 6.2867, -75.6011),

('Fundación Sembrando Esperanza',
 'ong',
 'Cra. 52 #80-30, Bello, Antioquia',
 '["Frutas y verduras", "Alimentos secos", "Enlatados"]',
 6.3413, -75.5582),

('Red de Comedores Itagüí',
 'ong',
 'Cl. 50 #54-17, Centro, Itagüí, Antioquia',
 '["Carnes", "Alimentos secos", "Panadería", "Lácteos"]',
 6.1821, -75.5975),

('Fundación Pan y Vida Envigado',
 'ong',
 'Cra. 46 #32Sur-60, Envigado, Antioquia',
 '["Panadería", "Lácteos", "Frutas y verduras", "Bebidas"]',
 6.1712, -75.5856);
