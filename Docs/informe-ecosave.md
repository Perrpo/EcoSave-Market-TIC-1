# Informe de Estado del Sistema — EcoSave Market TIC-1

| Campo | Detalle |
|---|---|
| **Fecha** | 16 de marzo de 2026 |
| **Repositorio** | [Perrpo/EcoSave-Market-TIC-1](https://github.com/Perrpo/EcoSave-Market-TIC-1) |
| **Último commit** | `feat: Add comprehensive setup and documentation for email system and user roles` — 09/03/2026 |
| **Autores** | Andres Felipe Nuñez Hernandez, Jose David Velez Gallego, Gloria, Juan |

---

## 1. Introducción

EcoSave Market es una plataforma anti-desperdicio que conecta **minimercados y tienda de barrio** y a futuro **supermercados**, **ONGs** y un **administrador central**. Este informe analiza el estado actual del desarrollo, identifica módulos implementados, detecta inconsistencias y define oportunidades de mejora.

---

## 2. Estructura del Repositorio

EcoSave-Market-TIC-1/
├── backend-app/ → API REST (AdonisJS v6 + TypeScript)
├── frontend-app/ → Cliente web (React + Vite + TypeScript)
└── Docs/ → Documentación del proyecto

---

## 3. Módulos Implementados

### Backend — Controladores

| Controlador | Responsabilidad |
|---|---|
| `auth_controller.ts` | Registro, login y logout |
| `order_controller.ts` | CRUD y flujo RPA de órdenes |
| `user_controller.ts` | Gestión básica de usuarios |
| `supabase_test_controller.ts` | Pruebas de conexión a BD |

### Backend — Servicios

| Servicio | Responsabilidad |
|---|---|
| `email_service.ts` | Envío de correos (Nodemailer) |
| `invoice_generator_service.ts` | Generación de facturas PDF (PDFKit) |
| `order_processor_service.ts` | Orquestación del flujo RPA |
| `order_validator_service.ts` | Validación de órdenes |
| `supabase_service.ts` | Cliente singleton de Supabase |

### Backend — Otros componentes

- **2 middlewares**: `force_json_response` y `container_bindings`
- **Scheduler**: `order_scheduler.ts` — procesamiento automático con `node-cron`
- **Rutas**: CRUD de usuarios, autenticación y 12 endpoints de órdenes bajo `/api/v1`

### Frontend — Páginas

| Página | Actor |
|---|---|
| `Dashboard.tsx` | Supermercado |
| `DashboardAdmin.tsx` | Administrador |
| `DashboardONG.tsx` | ONG |
| `Map.tsx` | Todos |
| `Notifications.tsx` | Todos |

---

## 4. Flujo General del Sistema

Cliente React
↓ HTTP
API (/api/v1) → Middleware → Controller → Service → Supabase (PostgreSQL)


**Flujo de una orden:**
1. Supermercado crea la orden → `POST /api/v1/orders`
2. `OrderValidatorService` valida los datos
3. `OrderProcessorService` ejecuta el flujo RPA
4. `InvoiceGeneratorService` genera el PDF
5. `EmailService` notifica a los actores involucrados
6. `order_scheduler.ts` procesa órdenes pendientes automáticamente

---

## 5. Problemas Detectados

| Severidad | Problema |
|---|---|
| 🔴 Crítico | Middleware de autenticación comentado en `/auth/logout` |
| 🔴 Crítico | Rutas de órdenes sin protección de autenticación |
| 🟡 Moderado | Rutas de diagnóstico de Supabase expuestas en producción |
| 🟡 Moderado | `UserController` muy pequeño (884 B) — funcionalidad incompleta |
| 🟡 Moderado | No se detectó directorio `models/` para el ORM Lucid |
| 🟢 Menor | Sin separación de rutas por rol de actor |
| 🟢 Menor | Versión del proyecto en `0.0.0` — sin versionado semántico |

---

## 6. Oportunidades de Mejora

| Prioridad | Acción |
|---|---|
| 🔴 Alta | Aplicar middleware `auth` en rutas protegidas |
| 🔴 Alta | Crear modelos Lucid para las entidades del sistema |
| 🔴 Alta | Restringir o eliminar rutas de diagnóstico de Supabase |
| 🟡 Media | Implementar RBAC (control de acceso por roles) |
| 🟡 Media | Expandir `UserController` con gestión de perfiles y roles |
| 🟢 Baja | Documentar la API con Swagger / OpenAPI |
| 🟢 Baja | Agregar cobertura de pruebas unitarias e integración |

---

## 7. Resumen Ejecutivo

| Componente | Estado |
|---|---|
| API Backend | ✅ Funcional |
| Autenticación | ⚠️ Parcial — rutas sin proteger |
| Módulo de Órdenes | ✅ Avanzado |
| Módulo de Usuarios | ⚠️ Incompleto |
| Frontend (3 dashboards) | ✅ Funcional |
| Base de Datos (Supabase) | ✅ Conectado |
| Modelos ORM | ❓ Por confirmar |
| Seguridad | 🔴 Incompleta |

> El equipo puede continuar con nuevas funcionalidades, pero se recomienda resolver primero los puntos de seguridad críticos antes de avanzar.

---
--- 

## 8. Modelo de Datos (Conceptual)

Aunque no se identificó explícitamente un directorio `models/`, el sistema sugiere la existencia de las siguientes entidades principales:

| Entidad | Descripción |
|---|---|
| `User` | Usuario del sistema (Supermercado, ONG o Administrador) |
| `Order` | Orden de donación o entrega |
| `Invoice` | Factura generada automáticamente |
| `Notification` | Mensajes o avisos del sistema |

---

## 9. Conclusión Técnica

El sistema **EcoSave Market** presenta una base tecnológica sólida basada en un stack moderno (React + AdonisJS + Supabase). El módulo de órdenes muestra un nivel avanzado de desarrollo con automatización mediante scheduler y generación automática de documentos.

Sin embargo, antes de avanzar con nuevas funcionalidades, se recomienda fortalecer aspectos clave como:

- Seguridad de rutas
- Definición de modelos de datos
- Implementación de control de acceso por roles
- Incorporación de pruebas automatizadas

Una vez resueltos estos puntos, el sistema estará mejor preparado para escalar y soportar nuevas funcionalidades dentro del proyecto.

---

*Universidad Pontificia Bolivariana — Medellín, 2026 | Proyecto TIC-1*
