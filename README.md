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

## 🏗️ Arquitectura por Capas (Layered Architecture)

El proyecto ha migrado de una estructura monolítica a una **arquitectura por capas**, garantizando separación de responsabilidades, alta mantenibilidad y escalabilidad.

### Estructura de Directorios

```text
EcoSave-Market-TIC-1/
├── frontend-app/          # Cliente React (Vite + TypeScript)
│   └── src/
│       ├── components/    # Componentes UI reutilizables (Sidebar, Modals)
│       ├── context/       # Estados globales (AuthContext, NotificationContext)
│       ├── pages/         # Vistas principales separadas por rol (DashboardONG, etc.)
│       └── services/      # Cliente API encapsulado (api.ts) para llamadas al backend
│
├── backend-app/           # API REST (AdonisJS 6 + TypeScript)
│   └── app/
│       ├── controllers/   # Capa de Presentación: Maneja peticiones HTTP y respuestas
│       ├── services/      # Capa de Negocio: Lógica central, validaciones y reglas
│       └── repositories/  # Capa de Acceso a Datos: Interacción exclusiva con Supabase (SQL)
│
└── Docs/                  # Documentación del proyecto
```

### Patrón de Diseño del Backend

El backend implementa el patrón **Controller-Service-Repository**:

1.  **Controllers (`app/controllers/http/`):** Reciben las peticiones HTTP, extraen el token JWT, y delegan toda la lógica a los servicios. No contienen consultas a la base de datos.
2.  **Services (`app/services/`):** Contienen el "cerebro" de la aplicación. Orquestan múltiples repositorios (ej: `DonationService` llama a `ProductRepository` y `NotificationRepository`), emiten eventos y aplican reglas de negocio (ej: verificar que una donación siga disponible).
3.  **Repositories (`app/repositories/`):** Son la única capa que interactúa con la base de datos (Supabase). Aislan las consultas de la base de datos del resto de la aplicación, haciendo el código más testeable.

### Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----|
| **Frontend UI** | React 18 + TS | Construcción de interfaces reactivas |
| **Styling** | Vanilla CSS | Diseño limpio ("Estilo Ejecutivo") basado en tokens |
| **Backend API** | AdonisJS 6 | Enrutamiento HTTP y validaciones |
| **Base de datos** | Supabase (PostgreSQL) | Almacenamiento centralizado y RLS |
| **Notificaciones**| HTTP Polling | Sincronización asíncrona entre roles |

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
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key   # ← NO la anon key

# AdonisJS
PORT=3333
HOST=localhost
NODE_ENV=development
APP_KEY=tu_app_key_generada
```

> ⚠️ La `service_role` key bypasea RLS. Úsala **solo en el backend** y nunca la expongas al frontend.

Iniciar el servidor:

```bash
node ace serve --hmr
```

### 3. Configurar el Frontend

```bash
cd ../frontend-app
npm install
```

> ℹ️ **Nota:** El frontend no requiere configuración de variables de entorno (como `.env.local`), ya que toda la comunicación pasa directamente por el backend de AdonisJS (puerto 3333), manteniendo las credenciales de Supabase seguras en el servidor.

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
| HU07 | Sistema de notificaciones en tiempo real (Backend polling) | ✅ |
| HU08 | Historial persistente de donaciones | ✅ |
| HU09 | Métricas de impacto por dashboard | ✅ |
| HU10 | Panel administrativo | 🟡 Parcial |

---

## 🚧 Roadmap

- [ ] **Solicitudes parciales** — permitir solicitar una cantidad específica (no toda la donación)
- [ ] **Comprobante PDF** — generar soporte formal de donación para fines contables
- [ ] **Redistribución inteligente** — asignación automática de sobrantes a otras ONGs
- [ ] **Dashboard Admin completo** — métricas globales conectadas al backend real

---

## 📌 Estado actual

```
✅ Autenticación completa con roles (supermarket / ong)
✅ Dashboard Supermercado funcional
✅ Dashboard ONG funcional
✅ Flujo completo de donaciones (crear → solicitar → confirmar)
✅ Sistema de notificaciones persistentes (con polling al backend)
✅ Mapa de puntos de recolección (tabla locations)
✅ RLS configurado en products y donations
✅ API REST con AdonisJS 6 (puerto 3333)
✅ Protección de rutas por rol (previene el acceso cruzado entre dashboards)
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
