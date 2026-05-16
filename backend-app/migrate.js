/**
 * migrate.js — Ejecuta las migraciones de TSK-011 y TSK-017
 *
 * Uso:
 *   cd backend-app
 *   node migrate.js
 *
 * Requiere que exista el archivo .env en backend-app/ con:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Leer .env manualmente (sin dependencias extra) ────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '.env')

let SUPABASE_URL = ''
let SUPABASE_SERVICE_ROLE_KEY = ''

try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const [key, ...rest] = trimmed.split('=')
    const value = rest.join('=').trim()
    if (key.trim() === 'SUPABASE_URL') SUPABASE_URL = value
    if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') SUPABASE_SERVICE_ROLE_KEY = value
  }
} catch {
  console.error('❌ No se encontró el archivo .env en backend-app/')
  process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ── Ejecutar SQL via RPC exec_sql (Supabase pg_net / postgres functions) ──
// Usamos fetch directo a la API de Supabase Management porque el cliente JS
// no expone ejecución de DDL arbitrario en el tier gratuito.
async function runSQL(label, sql) {
  process.stdout.write(`  ⏳ ${label}... `)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  })

  if (!res.ok) {
    // exec_sql puede no existir; fallback a pg endpoint
    const err = await res.text()
    process.stdout.write(`⚠️  (exec_sql no disponible, usando pg endpoint)\n`)
    return runSQLviaPg(label, sql)
  }
  process.stdout.write('✅\n')
}

async function runSQLviaPg(label, sql) {
  // Supabase expone /pg/query en proyectos con acceso directo a postgres
  const res = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!res.ok) {
    const err = await res.text()
    process.stdout.write(`❌\n`)
    console.error(`     Error en "${label}":`, err.slice(0, 300))
    return false
  }
  process.stdout.write(`✅\n`)
  return true
}

// ── Pasos de migración como sentencias individuales ───────────────────
const steps = [
  // ═══════════════════════════════════════════════
  // TSK-011: Tabla donation_certificates
  // ═══════════════════════════════════════════════
  [
    'Función set_updated_at()',
    `CREATE OR REPLACE FUNCTION public.set_updated_at()
     RETURNS TRIGGER LANGUAGE plpgsql AS $$
     BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;`,
  ],
  [
    'Tabla donation_certificates',
    `CREATE TABLE IF NOT EXISTS public.donation_certificates (
       id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
       codigo_certificado  text        NOT NULL UNIQUE,
       donation_id         integer     NOT NULL,
       donante_id          integer     NOT NULL,
       donatario_id        integer     NOT NULL,
       fecha_emision       timestamptz NOT NULL DEFAULT now(),
       fecha_recepcion     timestamptz,
       producto            text        NOT NULL,
       categoria           text        NOT NULL,
       cantidad            integer     NOT NULL,
       valor_estimado      numeric(12,2) NOT NULL DEFAULT 0,
       valor_transporte    numeric(12,2) NOT NULL DEFAULT 0,
       valor_total         numeric(12,2) NOT NULL DEFAULT 0,
       qr_hash             text        NOT NULL UNIQUE,
       estado              text        NOT NULL DEFAULT 'vigente'
                             CHECK (estado IN ('vigente', 'anulado', 'vencido')),
       created_at          timestamptz NOT NULL DEFAULT now(),
       updated_at          timestamptz NOT NULL DEFAULT now(),
       CONSTRAINT donation_certificates_pkey     PRIMARY KEY (id),
       CONSTRAINT fk_cert_donation  FOREIGN KEY (donation_id)  REFERENCES public.donations(id),
       CONSTRAINT fk_cert_donante   FOREIGN KEY (donante_id)   REFERENCES public.users(id),
       CONSTRAINT fk_cert_donatario FOREIGN KEY (donatario_id) REFERENCES public.users(id)
     );`,
  ],
  [
    'Índices donation_certificates',
    `CREATE INDEX IF NOT EXISTS idx_certs_codigo      ON public.donation_certificates (codigo_certificado);
     CREATE INDEX IF NOT EXISTS idx_certs_donante     ON public.donation_certificates (donante_id);
     CREATE INDEX IF NOT EXISTS idx_certs_donatario   ON public.donation_certificates (donatario_id);
     CREATE INDEX IF NOT EXISTS idx_certs_fecha       ON public.donation_certificates (fecha_emision);
     CREATE INDEX IF NOT EXISTS idx_certs_estado      ON public.donation_certificates (estado);
     CREATE INDEX IF NOT EXISTS idx_certs_donation_id ON public.donation_certificates (donation_id);
     CREATE INDEX IF NOT EXISTS idx_certs_qr_hash     ON public.donation_certificates (qr_hash);`,
  ],
  [
    'Trigger updated_at en donation_certificates',
    `DROP TRIGGER IF EXISTS trg_certs_updated_at ON public.donation_certificates;
     CREATE TRIGGER trg_certs_updated_at
       BEFORE UPDATE ON public.donation_certificates
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();`,
  ],

  // ═══════════════════════════════════════════════
  // TSK-017: Catálogos de inventario
  // ═══════════════════════════════════════════════
  [
    'Tabla product_categories',
    `CREATE TABLE IF NOT EXISTS public.product_categories (
       id          serial      NOT NULL,
       nombre      text        NOT NULL UNIQUE,
       descripcion text,
       activo      boolean     NOT NULL DEFAULT true,
       created_at  timestamptz NOT NULL DEFAULT now(),
       CONSTRAINT product_categories_pkey PRIMARY KEY (id)
     );`,
  ],
  [
    'Datos iniciales product_categories',
    `INSERT INTO public.product_categories (nombre) VALUES
       ('Panadería'),('Lácteos'),('Frutas'),('Verduras'),('Carnes'),
       ('Bebidas'),('Snacks'),('Higiene'),('Aseo'),('Congelados'),
       ('Enlatados'),('Otros')
     ON CONFLICT (nombre) DO NOTHING;`,
  ],
  [
    'Tabla product_statuses',
    `CREATE TABLE IF NOT EXISTS public.product_statuses (
       id          serial NOT NULL,
       codigo      text   NOT NULL UNIQUE,
       label       text   NOT NULL,
       descripcion text,
       activo      boolean NOT NULL DEFAULT true,
       CONSTRAINT product_statuses_pkey PRIMARY KEY (id)
     );`,
  ],
  [
    'Datos iniciales product_statuses',
    `INSERT INTO public.product_statuses (codigo, label, descripcion) VALUES
       ('Disponible',  'Disponible',  'Sin alerta de vencimiento'),
       ('Advertencia', 'Advertencia', 'Vence en 3–7 días'),
       ('Urgente',     'Urgente',     'Vence en 1–2 días'),
       ('Vencido',     'Vencido',     'Fuera de fecha'),
       ('Donado',      'Donado',      'Registrado como donación'),
       ('Descuento',   'Descuento',   'En oferta con descuento'),
       ('Retirado',    'Retirado',    'Retirado del inventario')
     ON CONFLICT (codigo) DO NOTHING;`,
  ],
  [
    'Tabla inventory_items (normalizada)',
    `CREATE TABLE IF NOT EXISTS public.inventory_items (
       id              integer     GENERATED ALWAYS AS IDENTITY NOT NULL,
       product_id      integer     NOT NULL,
       user_id         integer     NOT NULL,
       category_id     integer     NOT NULL,
       status_id       integer     NOT NULL DEFAULT 1,
       nombre          text        NOT NULL,
       unidades        integer     NOT NULL CHECK (unidades >= 0),
       precio          numeric(10,2),
       descuento       numeric(5,2) NOT NULL DEFAULT 0
                         CHECK (descuento >= 0 AND descuento <= 100),
       vencimiento     timestamptz NOT NULL,
       imagen          text,
       lote            text,
       codigo_barras   text,
       ubicacion       text,
       created_at      timestamptz NOT NULL DEFAULT now(),
       updated_at      timestamptz NOT NULL DEFAULT now(),
       CONSTRAINT inventory_items_pkey       PRIMARY KEY (id),
       CONSTRAINT fk_inv_product  FOREIGN KEY (product_id)  REFERENCES public.products(id),
       CONSTRAINT fk_inv_user     FOREIGN KEY (user_id)     REFERENCES public.users(id),
       CONSTRAINT fk_inv_category FOREIGN KEY (category_id) REFERENCES public.product_categories(id),
       CONSTRAINT fk_inv_status   FOREIGN KEY (status_id)   REFERENCES public.product_statuses(id)
     );`,
  ],
  [
    'Índices inventory_items',
    `CREATE INDEX IF NOT EXISTS idx_inv_user        ON public.inventory_items (user_id);
     CREATE INDEX IF NOT EXISTS idx_inv_category    ON public.inventory_items (category_id);
     CREATE INDEX IF NOT EXISTS idx_inv_status      ON public.inventory_items (status_id);
     CREATE INDEX IF NOT EXISTS idx_inv_vencimiento ON public.inventory_items (vencimiento);
     CREATE INDEX IF NOT EXISTS idx_inv_product     ON public.inventory_items (product_id);`,
  ],
  [
    'Trigger updated_at en inventory_items',
    `DROP TRIGGER IF EXISTS trg_inv_updated_at ON public.inventory_items;
     CREATE TRIGGER trg_inv_updated_at
       BEFORE UPDATE ON public.inventory_items
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();`,
  ],
  [
    'Vista v_inventory (compatibilidad legacy)',
    `CREATE OR REPLACE VIEW public.v_inventory AS
     SELECT p.id, p.user_id, p.nombre,
            pc.nombre AS categoria, pc.id AS category_id,
            p.unidades, p.vencimiento,
            ps.codigo AS estado, ps.id AS status_id,
            p.precio, p.descuento, p.imagen,
            p.created_at, p.updated_at
     FROM public.products p
     LEFT JOIN public.product_categories pc ON pc.nombre = p.categoria
     LEFT JOIN public.product_statuses   ps ON ps.codigo = p.estado;`,
  ],
  [
    'Migrar productos existentes a inventory_items',
    `INSERT INTO public.inventory_items
       (product_id, user_id, category_id, status_id, nombre, unidades, precio, descuento, vencimiento, imagen)
     SELECT
       p.id, p.user_id,
       COALESCE(pc.id, (SELECT id FROM public.product_categories WHERE nombre = 'Otros')),
       COALESCE(ps.id, (SELECT id FROM public.product_statuses   WHERE codigo = 'Disponible')),
       p.nombre, p.unidades, p.precio, p.descuento, p.vencimiento, p.imagen
     FROM public.products p
     LEFT JOIN public.product_categories pc ON pc.nombre = p.categoria
     LEFT JOIN public.product_statuses   ps ON ps.codigo = p.estado
     WHERE NOT EXISTS (
       SELECT 1 FROM public.inventory_items ii WHERE ii.product_id = p.id
     );`,
  ],
  [
    'Función refresh_inventory_statuses()',
    `CREATE OR REPLACE FUNCTION public.refresh_inventory_statuses()
     RETURNS void LANGUAGE plpgsql AS $$
     DECLARE
       st_disponible  integer := (SELECT id FROM public.product_statuses WHERE codigo = 'Disponible');
       st_advertencia integer := (SELECT id FROM public.product_statuses WHERE codigo = 'Advertencia');
       st_urgente     integer := (SELECT id FROM public.product_statuses WHERE codigo = 'Urgente');
       st_vencido     integer := (SELECT id FROM public.product_statuses WHERE codigo = 'Vencido');
     BEGIN
       UPDATE public.inventory_items SET status_id = st_vencido
         WHERE vencimiento < now()
           AND status_id NOT IN (SELECT id FROM public.product_statuses WHERE codigo IN ('Donado','Retirado','Descuento'));
       UPDATE public.inventory_items SET status_id = st_urgente
         WHERE vencimiento BETWEEN now() AND now() + INTERVAL '2 days'
           AND status_id NOT IN (SELECT id FROM public.product_statuses WHERE codigo IN ('Vencido','Donado','Retirado','Descuento'));
       UPDATE public.inventory_items SET status_id = st_advertencia
         WHERE vencimiento BETWEEN now() + INTERVAL '2 days' AND now() + INTERVAL '7 days'
           AND status_id NOT IN (SELECT id FROM public.product_statuses WHERE codigo IN ('Vencido','Urgente','Donado','Retirado','Descuento'));
       UPDATE public.inventory_items SET status_id = st_disponible
         WHERE vencimiento > now() + INTERVAL '7 days'
           AND status_id IN (st_advertencia, st_urgente);
     END; $$;`,
  ],
]

// ── Runner principal ──────────────────────────────────────────────────
async function main() {
  console.log('\n🌿 EcoSave Market — Migración TSK-011 + TSK-017')
  console.log('─'.repeat(52))

  let ok = 0
  let fail = 0

  for (const [label, sql] of steps) {
    const success = await runSQL(label, sql)
    if (success === false) fail++
    else ok++
  }

  console.log('─'.repeat(52))
  if (fail === 0) {
    console.log(`✅ Migración completada — ${ok} pasos ejecutados correctamente.\n`)
  } else {
    console.log(`⚠️  Completado con ${fail} error(es). Revisa los mensajes anteriores.\n`)
    console.log('💡 Si los errores dicen "exec_sql not found", ejecuta el SQL manualmente')
    console.log('   en Supabase → SQL Editor → pega el contenido del archivo .sql\n')
  }
}

main().catch((e) => {
  console.error('Error inesperado:', e)
  process.exit(1)
})
