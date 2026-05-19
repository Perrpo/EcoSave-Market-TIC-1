<div align="center">

<img src="https://img.shields.io/badge/EcoSave%20Market-Sostenibilidad%20y%20Confianza-2ea44f?style=for-the-badge&logo=leaf&logoColor=white" alt="EcoSave Market"/>

# EcoSave Market

**Plataforma web para reducir el desperdicio de alimentos conectando supermercados y ONGs**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![AdonisJS](https://img.shields.io/badge/AdonisJS-6-5A45FF?style=flat&logo=adonisjs&logoColor=white)](https://adonisjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://docs.docker.com/compose/)

</div>

---

## ¿Qué es EcoSave Market?

EcoSave Market es una plataforma web de economía circular que **conecta supermercados con productos próximos a vencer y ONGs que necesitan alimentos**. El sistema elimina la barrera logística entre ambos actores, permitiendo gestionar donaciones de forma trazable, rápida y transparente.

> **Proyecto académico** — Universidad Pontificia Bolivariana · Curso TIC 1 · 2026

---

## Funcionalidades principales

### Para Supermercados
- Registrar productos próximos a vencer con fecha de vencimiento y unidades
- Publicar donaciones disponibles para ONGs
- Ver historial completo de donaciones realizadas
- Recibir notificaciones cuando una ONG solicita sus productos
- Generar certificados PDF de donación con deducción tributaria (Ley 2380/2024)
- Enviar reportes consolidados por correo electrónico
- Dashboard con métricas de impacto (productos donados, kg rescatados)

### Para ONGs
- Explorar donaciones disponibles en tiempo real
- Solicitar alimentos con cantidad específica (solicitudes parciales)
- Confirmar recepción y cerrar el ciclo de la donación
- Consultar mapa de puntos de recolección con filtros por especialidad
- Historial de recepciones y estadísticas de impacto

### Sistema de Roles
- **Dos roles:** `supermarket` (supermercado) y `ong`
- Registro con selección de rol obligatoria
- Login sin requerir rol — el sistema detecta y redirige automáticamente al dashboard correspondiente
- Dashboards completamente independientes por rol
- Rutas protegidas según el tipo de usuario

---

## Arquitectura por Capas

El proyecto implementa una **arquitectura por capas** (Controller-Service-Repository), garantizando separación de responsabilidades y alta mantenibilidad.

### Estructura de Directorios

```text
EcoSave-Market-TIC-1/
├── frontend-app/          # Cliente React (Vite + TypeScript)
│   └── src/
│       ├── components/    # Componentes UI reutilizables (Sidebar, AuthForm)
│       ├── context/       # Estados globales (AuthContext, NotificationContext)
│       ├── pages/         # Vistas por rol (Dashboard, DashboardONG, Map...)
│       └── services/      # Cliente API encapsulado (api.ts)
│
├── backend-app/           # API REST (AdonisJS 6 + TypeScript)
│   └── app/
│       ├── controllers/   # Capa HTTP: maneja peticiones y respuestas
│       ├── services/      # Capa de negocio: lógica central y reglas de dominio
│       └── repositories/  # Capa de datos: interacción exclusiva con Supabase
│
└── Docs/                  # Documentación del proyecto
```

### Patrón Controller-Service-Repository

1. **Controllers** — Reciben la petición HTTP, extraen el token JWT y delegan al servicio. Sin lógica de negocio ni consultas a base de datos.
2. **Services** — Orquestan repositorios, aplican reglas de negocio (verificar disponibilidad, redistribuir sobrantes, emitir notificaciones) y coordinan efectos secundarios (emails, certificados PDF).
3. **Repositories** — Única capa que habla con Supabase. Aíslan las consultas SQL del resto de la aplicación.

### Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **Frontend UI** | React 19 + TypeScript 5.9 | Interfaces reactivas con SPA |
| **Build tool** | Vite 7 | Compilación y HMR en desarrollo |
| **Styling** | Vanilla CSS + componentes UI propios | Diseño basado en tokens CSS |
| **Backend API** | AdonisJS 6 + TypeScript 5.8 | Enrutamiento HTTP, middleware y validaciones |
| **Base de datos** | Supabase (PostgreSQL) | Almacenamiento centralizado con RLS |
| **Notificaciones** | HTTP Polling | Sincronización asíncrona entre roles |
| **Contenedores** | Docker + Docker Compose | Despliegue reproducible |

---

## Modelo de datos

```
profiles          products           donations          locations
─────────         ────────           ─────────          ─────────
id (FK auth)      id                 id                 id
role              user_id (FK)       product_id (FK)    nombre
business_name     nombre             user_id (FK)       tipo (ONG/SUPERMERCADO)
phone             categoria          ong_id (FK)        direccion
nit               unidades           status             especialidades (jsonb)
                  fecha_vencimiento  created_at         lat / lng
                  created_at         updated_at

notifications     orders             email_logs
─────────────     ──────             ──────────
id                id                 id
user_id (FK)      donation_id (FK)   recipient_email
mensaje           ong_id (FK)        subject
leida             cantidad           sent_at
created_at        status
                  created_at
```

---

## Cómo iniciar la plataforma

### Opción A — Docker (recomendado)

La forma más rápida. No requiere instalar Node.js ni configurar dependencias manualmente.

**Requisitos:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo

**1. Clonar el repositorio**
```bash
git clone https://github.com/Perrpo/EcoSave-Market-TIC-1.git
cd EcoSave-Market-TIC-1
```

**2. Crear el archivo de entorno del backend**
```bash
cp backend-app/.env.example backend-app/.env
```

Abrir `backend-app/.env` y completar con las credenciales reales:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-supabase-anon-key
APP_KEY=una-cadena-aleatoria-segura
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password-de-gmail
PORT=3333
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info
FRONTEND_URL=http://localhost:5173
```

**3. Construir y levantar los contenedores**
```bash
docker compose up --build
```

La primera vez puede tardar 2–3 minutos mientras se construyen las imágenes.

**4. Abrir en el navegador**

| Servicio | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend (health check) | http://localhost:3333/api/v1/health |

**Comandos útiles:**
```bash
# Ver logs en tiempo real
docker compose logs --follow

# Detener los contenedores
docker compose down

# Reconstruir después de cambios en el código
docker compose up --build
```

---

### Opción B — Desarrollo local

Para modificar código con hot-reload.

**Requisitos:**
- Node.js >= 20
- npm >= 9
- Una cuenta en [Supabase](https://supabase.com) con proyecto creado

**1. Clonar el repositorio**
```bash
git clone https://github.com/Perrpo/EcoSave-Market-TIC-1.git
cd EcoSave-Market-TIC-1
```

**2. Configurar y arrancar el backend**
```bash
cd backend-app
cp .env.example .env
# Editar .env con las credenciales reales de Supabase y Gmail
npm install
node ace serve --hmr
```

El backend queda en `http://localhost:3333`.

**3. Configurar y arrancar el frontend**
```bash
cd ../frontend-app
npm install
npm run dev
```

El frontend queda en `http://localhost:5173`.

---

## Flujo principal del sistema

```
Supermercado registra         ONG explora
producto próximo a vencer  →  donaciones disponibles
        ↓                            ↓
Se publica como donación   →  ONG solicita el producto
        ↓                     (cantidad parcial o total)
Supermercado recibe                  ↓
notificación              Sistema actualiza estado
        ↓                 y notifica al supermercado
                   ONG confirma recepción
                           ↓
             Donación completada — queda registrada
             en historial de ambos actores
                           ↓
              Si quedan sobrantes → redistribución
              automática a otras ONGs disponibles
```

---

## Seguridad — Row Level Security (RLS)

Las políticas RLS de Supabase garantizan el aislamiento de datos entre roles:

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

## Pruebas

El proyecto cuenta con una suite de pruebas unitarias y funcionales para el backend:

```bash
cd backend-app
npm test
```

| Tipo | Archivo | Cobertura |
|------|---------|-----------|
| Unitaria | `order_validator.spec.ts` | Validación de órdenes |
| Unitaria | `product_service.spec.ts` | Lógica de productos |
| Unitaria | `donation_service.spec.ts` | Lógica de donaciones |
| Funcional | `auth.spec.ts` | Endpoints de autenticación |
| Funcional | `products.spec.ts` | Endpoints de productos |
| Funcional | `donations.spec.ts` | Endpoints de donaciones |

---

## Historias de usuario implementadas

| ID | Historia | Estado |
|----|----------|--------|
| HU01 | Inicio de sesión con redirección automática por rol | ✅ |
| HU02 | Registro de productos próximos a vencer | ✅ |
| HU03 | Consulta de donaciones disponibles (ONG) | ✅ |
| HU04 | Solicitud de donación por parte de ONG (parcial o total) | ✅ |
| HU05 | Confirmación de recepción | ✅ |
| HU06 | Mapa de puntos de recolección con filtros | ✅ |
| HU07 | Sistema de notificaciones en tiempo real (polling) | ✅ |
| HU08 | Historial persistente de donaciones | ✅ |
| HU09 | Métricas de impacto por dashboard | ✅ |
| HU10 | Certificados PDF con deducción tributaria (Ley 2380/2024) | ✅ |
| HU11 | Envío de reportes consolidados por correo electrónico | ✅ |
| HU12 | Redistribución inteligente de sobrantes | ✅ |

---

## Estado actual

```
✅ Autenticación completa con dos roles (supermarket / ong)
✅ Dashboard Supermercado funcional
✅ Dashboard ONG funcional
✅ Flujo completo de donaciones (crear → solicitar → confirmar)
✅ Solicitudes parciales implementadas
✅ Redistribución inteligente de sobrantes
✅ Sistema de notificaciones persistentes (polling al backend)
✅ Mapa de puntos de recolección (tabla locations)
✅ RLS configurado en products y donations
✅ API REST con AdonisJS 6 (puerto 3333)
✅ Protección de rutas por rol
✅ Certificados PDF de donación (Ley 2380/2024)
✅ Envío de reportes consolidados por correo electrónico (SMTP Gmail)
✅ Keep-Alive service para prevenir dormancia del backend
✅ Suite de pruebas unitarias y funcionales (backend)
```

---

## Equipo

Proyecto académico de transformación digital desarrollado en la **Universidad Pontificia Bolivariana** — enfocado en economía circular, reducción del desperdicio alimentario y responsabilidad social empresarial.

---

<div align="center">

Hecho con amor en Medellín, Colombia

</div>
