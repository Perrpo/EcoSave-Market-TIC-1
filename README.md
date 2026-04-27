<div align="center">

<img src="https://img.shields.io/badge/EcoSave%20Market-Sostenibilidad%20y%20Confianza-2ea44f?style=for-the-badge&logo=leaf&logoColor=white" alt="EcoSave Market"/>

# 🌱 EcoSave Market

**Plataforma web para reducir el desperdicio de alimentos conectando supermercados y ONGs**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![AdonisJS](https://img.shields.io/badge/AdonisJS-6-5A45FF?style=flat&logo=adonisjs&logoColor=white)](https://adonisjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## 📖 ¿Qué es EcoSave Market?

EcoSave Market es una plataforma web de economía circular que **conecta supermercados con productos próximos a vencer y ONGs que necesitan alimentos**. El sistema elimina la barrera logística entre ambos actores, permitiendo gestionar donaciones de forma trazable, rápida y transparente.

> **Proyecto académico** — Universidad Pontificia Bolivariana · Curso TIC 1 · 2026

---

## ✨ Funcionalidades principales

### 🏪 Para Supermercados
- Registrar productos próximos a vencer con fecha de vencimiento y unidades
- Publicar donaciones disponibles para ONGs
- Ver historial completo de donaciones realizadas
- Recibir notificaciones cuando una ONG solicita sus productos
- Dashboard con métricas de impacto (productos donados, kg rescatados)

### 🤝 Para ONGs
- Explorar donaciones disponibles en tiempo real
- Solicitar alimentos con un clic
- Confirmar recepción y cerrar el ciclo de la donación
- Consultar mapa de puntos de recolección con filtros por especialidad
- Historial de recepciones y estadísticas de impacto

### 🔐 Sistema de Roles
- Registro con selección de rol (**Supermercado** o **ONG**)
- Login sin requerir rol — el sistema detecta y redirige automáticamente
- Dashboards completamente independientes por rol
- Rutas protegidas según el tipo de usuario

---

## 🏗️ Arquitectura

```
EcoSave-Market-TIC-1/
├── frontend-app/          # React + TypeScript + Vite
│   └── src/
│       ├── components/    # AuthForm, Sidebar, Modals, Cards
│       ├── context/       # AuthContext (sesión global)
│       ├── pages/         # Dashboard, DashboardONG, Map, Notifications
│       ├── services/      # api.ts (cliente HTTP al backend)
│       └── types/         # Interfaces TypeScript
│
├── backend-app/           # AdonisJS 6 + TypeScript
│   └── app/
│       ├── controllers/   # auth_controller, products_controller,
│       │                  # donations_controller, notifications_controller
│       ├── middleware/     # Autenticación JWT
│       └── services/      # Cliente Supabase (service_role)
│
└── Docs/                  # Documentación del proyecto
```

### Stack tecnológico

| Capa | Tecnología | Rol |
|------|-----------|-----|
| **Frontend** | React 18 + TypeScript | UI, routing, estado |
| **Build tool** | Vite 5 | Bundler ultrarrápido |
| **Backend** | AdonisJS 6 | API REST, validación, lógica de negocio |
| **Base de datos** | Supabase (PostgreSQL) | Persistencia, Auth, RLS |
| **Auth** | Supabase Auth + JWT | Autenticación stateless |
| **Seguridad DB** | Row Level Security (RLS) | Aislamiento de datos por usuario |

---

## 🗄️ Modelo de datos

```
profiles          products           donations          locations
─────────         ────────           ─────────          ─────────
id (FK auth)      id                 id                 id
roles[]           user_id (FK)       product_id (FK)    nombre
business_name     nombre             user_id (FK)       tipo (ONG/SUPERMERCADO)
phone             categoria          ong_id (FK)        direccion
nit               unidades           status             especialidades (jsonb)
                  fecha_vencimiento  created_at         lat / lng
                  created_at         updated_at

notifications     orders             email_logs
─────────────     ──────             ──────────
id                id                 id
user_id (FK)      ...                ...
mensaje
leida
created_at
```

---

## 🚀 Instalación y uso local

### Requisitos previos
- Node.js ≥ 18
- npm ≥ 9
- Una cuenta en [Supabase](https://supabase.com) con proyecto creado

### 1. Clonar el repositorio

```bash
git clone https://github.com/Perrpo/EcoSave-Market-TIC-1.git
cd EcoSave-Market-TIC-1
```

### 2. Configurar el Backend

```bash
cd backend-app
cp .env.example .env
npm install
```

Editar `.env` con tus credenciales de Supabase:

```env
TZ=UTC
PORT=3333
HOST=localhost
LOG_LEVEL=info
APP_KEY=tu_app_key_generada
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://otvxqjpofaibziffudwx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dnhxanBvZmFpYnppZmZ1ZHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjAwNzIsImV4cCI6MjA3ODI5NjA3Mn0.x_GWS6Vhtic1kT8gIskTa2lI-HIVGWiBZekBf-isVrA
```

> ⚠️ La `service_role` key bypasea RLS. Úsala **solo en el backend** y nunca la expongas al frontend.

Genera el APP_KEY:
```bash
node ace generate:key
```

Iniciar el servidor:

```bash
node ace serve --hmr
```

### 3. Configurar el Frontend

```bash
cd ../frontend-app
npm install
```

Crear `.env.local`:

```env
VITE_API_URL=http://localhost:3333/api/v1
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

Iniciar el frontend:

```bash
npm run dev
```

La app estará disponible en `http://localhost:5173`.

---

## 🔁 Flujo principal del sistema

```
Supermercado registra         ONG explora
producto próximo a vencer  →  donaciones disponibles
        ↓                            ↓
Se publica como donación   →  ONG solicita el producto
        ↓                            ↓
Supermercado recibe         Sistema actualiza estado
notificación                y notifica al supermercado
        ↓                            ↓
                    ONG confirma recepción
                            ↓
              Donación completada — queda registrada
              en historial de ambos actores
```

---

## 🔐 Seguridad — Row Level Security (RLS)

Las políticas RLS de Supabase garantizan el aislamiento de datos:

| Tabla | Política | Operación | Descripción |
|-------|----------|-----------|-------------|
| `products` | `supermarket_select_own` | SELECT | Cada supermercado ve solo sus productos |
| `products` | `ong_select_all` | SELECT | Las ONGs ven todos los productos disponibles |
| `donations` | `supermarket_select_own` | SELECT | Solo ve sus propias donaciones |
| `donations` | `ong_select_available` | SELECT | Ve donaciones disponibles o asignadas a ella |
| `donations` | `supermarket_insert` | INSERT | Solo el propietario puede crear donaciones |
| `donations` | `ong_request` | UPDATE | ONG puede cambiar status a `requested` |
| `donations` | `supermarket_complete` | UPDATE | Supermercado marca como `completed` |

---

## 📋 Historias de usuario implementadas

| ID | Historia | Estado |
|----|----------|--------|
| HU01 | Inicio de sesión con redirección automática por rol | ✅ |
| HU02 | Registro de productos próximos a vencer | ✅ |
| HU03 | Consulta de donaciones disponibles (ONG) | ✅ |
| HU04 | Solicitud de donación por parte de ONG | ✅ |
| HU05 | Confirmación de recepción | ✅ |
| HU06 | Mapa de puntos de recolección con filtros | ✅ |
| HU07 | Sistema de notificaciones en tiempo real | ✅ |
| HU08 | Historial persistente de donaciones | ✅ |
| HU09 | Métricas de impacto por dashboard | ✅ |
| HU10 | Panel administrativo | 🟡 Parcial |

---

## 🚧 Roadmap

- [ ] **Solicitudes parciales** — permitir solicitar una cantidad específica (no toda la donación)
- [ ] **Comprobante PDF** — generar soporte formal de donación para fines contables
- [ ] **Realtime con Supabase** — sincronización automática vía WebSockets sin refresh
- [ ] **Dashboard Admin completo** — métricas globales conectadas al backend real
- [ ] **Redistribución inteligente** — asignación automática de sobrantes a otras ONGs
- [ ] **Protección de rutas por rol** — middleware que impida acceso cruzado entre dashboards

---

## 📌 Estado actual

```
✅ Autenticación completa con roles (supermarket / ong)
✅ Dashboard Supermercado funcional
✅ Dashboard ONG funcional
✅ Flujo completo de donaciones (crear → solicitar → confirmar)
✅ Sistema de notificaciones
✅ Mapa de puntos de recolección (tabla locations)
✅ RLS configurado en products y donations
✅ API REST con AdonisJS 6 (puerto 3333)
🟡 Dashboard Admin parcialmente conectado
🟡 Solicitudes parciales pendientes
🟡 Generación de comprobante PDF pendiente
```

---

## 👥 Equipo

Proyecto académico de transformación digital desarrollado en la **Universidad Pontificia Bolivariana** — enfocado en economía circular, reducción del desperdicio alimentario y responsabilidad social empresarial.

---

<div align="center">

Hecho con 💚 en Medellín, Colombia

</div>
