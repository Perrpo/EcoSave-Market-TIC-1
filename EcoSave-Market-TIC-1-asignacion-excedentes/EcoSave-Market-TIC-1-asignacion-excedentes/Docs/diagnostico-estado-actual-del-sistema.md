# Diagnóstico del Estado Actual del Sistema — EcoSave Market

> **Archivo:** `diagnostico-estado-actual-del-sistema.md`  
> **Tarea:** TSK 013 - Analizar el estado actual del desarrollo del sistema y su arquitectura  
> **Versión:** v1.0.0 (2026-04-05)  
> **Autor:** [Tu nombre]

---

## Tabla de Contenidos

1. [Objetivo del Diagnóstico](#1-objetivo-del-diagnóstico)
2. [Arquitectura Técnica Actual](#2-arquitectura-técnica-actual)
3. [Módulos Implementados](#3-módulos-implementados)
4. [Estructura del Código y Dependencias](#4-estructura-del-código-y-dependencias)
5. [Flujo General de Funcionamiento](#5-flujo-general-de-funcionamiento)
6. [Inconsistencias y Problemas de Diseño](#6-inconsistencias-y-problemas-de-diseño)
7. [Resumen Ejecutivo para el Equipo](#7-resumen-ejecutivo-para-el-equipo)

---

## 1. Objetivo del Diagnóstico

Este documento analiza el estado real del desarrollo de la plataforma **EcoSave Market** a la fecha del diagnóstico. Su propósito es identificar los componentes ya implementados, contrastar el avance actual con el alcance definido en la propuesta del proyecto, detectar deuda técnica y brechas de diseño, y establecer una base clara para continuar el desarrollo de nuevas funcionalidades.

---

## 2. Arquitectura Técnica Actual

### 2.1 Stack Tecnológico

| Capa                  | Tecnología                         | Observaciones                                                                 |
|-----------------------|------------------------------------|-------------------------------------------------------------------------------|
| **Frontend**          | Aplicación web basada en componentes | Uso de `Context API` para manejo de estado global (sesiones de usuario)      |
| **Backend**           | Supabase (BaaS)                    | Gestiona autenticación, base de datos PostgreSQL y almacenamiento             |
| **Base de datos**     | PostgreSQL (vía Supabase)          | Estructura actual de tipo CRUD básico; sin modelo transaccional completo      |
| **Autenticación**     | Supabase Auth                      | Registro e inicio de sesión funcional con diferenciación básica de perfiles   |
| **Gestión de estado** | Context API                        | Manejo del estado global del frontend (sesión activa, rol del usuario)        |

### 2.2 Diagrama de Arquitectura Actual

┌─────────────────────────────────────────────────┐
│ FRONTEND │
│ │
│ ┌──────────┐ ┌───────────┐ ┌─────────────┐ │
│ │ Login / │ │ Dashboard │ │ Listado │ │
│ │ Register │ │ Productos │ │ ONGs │ │
│ └──────────┘ └───────────┘ └─────────────┘ │
│ │
│ Context API (Estado global) │
└───────────────────────┬─────────────────────────┘
│
│ SDK Supabase
▼
┌─────────────────────────────────────────────────┐
│ SUPABASE (BaaS) │
│ │
│ ┌────────────────┐ ┌──────────────────┐ │
│ │ Supabase Auth │ │ PostgreSQL DB │ │
│ │ (Sesiones / │ │ (Tablas CRUD │ │
│ │ Roles básicos│ │ actuales) │ │
│ └────────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────┘


---

## 3. Módulos Implementados

A continuación se listan los módulos funcionales presentes en el sistema a la fecha del diagnóstico:

### 3.1 Módulo de Autenticación ✅
- Registro e inicio de sesión funcional.
- Diferenciación básica de perfiles (Tienda/Restaurante, ONG, Consumidor).
- Gestión de sesión mediante Supabase Auth y Context API.
- Navegación controlada según rol del usuario autenticado.

### 3.2 Dashboard Intuitivo ✅
- Panel principal que muestra productos próximos a vencer.
- Información por producto: nombre, fecha de vencimiento, cantidad, estado.
- Filtros por categoría y estado.
- Acciones rápidas disponibles: **"Donar"** y **"Descuento"** (botones en UI).
- Estadísticas básicas en tiempo real.

### 3.3 Listado de Ubicaciones de ONGs ✅
- Visualización básica de ONGs registradas en la plataforma.
- Muestra puntos de recolección disponibles.
- Reemplazó la funcionalidad de mapa interactivo del diseño original.

### 3.4 Sistema de Notificaciones ✅ (Parcial)
- Alertas básicas en el frontend sobre productos próximos a caducar.
- Confirmación visual de procesos de donación iniciados.
- **No cuenta** con proceso batch automatizado que recalcule alertas diariamente.

---

## 4. Estructura del Código y Dependencias

### 4.1 Organización general del proyecto

/
├── /src
│ ├── /components ← Componentes reutilizables de la UI
│ ├── /pages ← Vistas principales (Login, Dashboard, ONGs)
│ ├── /context ← Context API: estado global de sesión y rol
│ └── /lib ← Configuración del cliente Supabase (supabaseClient.js)
├── /docs
│ └── logica-de-negocio-ONG-y-alimentos-proximos-a-vencer.md
├── .env ← Variables de entorno (URL y clave pública Supabase)
└── README.md


### 4.2 Dependencias principales

| Dependencia         | Uso                                              |
|---------------------|--------------------------------------------------|
| `@supabase/supabase-js` | Cliente para interactuar con Supabase Auth y DB |
| Context API (React)  | Manejo de estado global de sesión y perfil       |
| Librería de UI       | Componentes visuales del dashboard               |

---

## 5. Flujo General de Funcionamiento

El flujo actual del sistema cubre únicamente la etapa inicial del ciclo completo:

┌──────────────┐ ┌────────────────────┐ ┌─────────────────────┐
│ Usuario │────▶│ Autenticación │────▶│ Dashboard │
│ (Tienda / │ │ (Supabase Auth) │ │ (Productos por │
│ ONG / │ │ │ │ vencer + acciones)│
│ Consumidor)│ └────────────────────┘ └──────────┬──────────┘
└──────────────┘ │
│ Acción "Donar"
▼
┌─────────────────────┐
│ Listado de ONGs │
│ (Puntos de │
│ recolección) │
└─────────────────────┘

⚠️ El flujo se interrumpe aquí. Los estados de la donación
(PENDIENTE → ACEPTADA → RECIBIDA), la gestión de inventario
y la distribución a beneficiarios aún no están implementados.


---

## 6. Inconsistencias y Problemas de Diseño

### 6.1 Base de Datos — Deuda técnica crítica

| Problema | Impacto | Prioridad |
|---|---|:---:|
| No existen las tablas `Lote (Batch)` ni `Movimiento de Inventario (InventoryMovement)` en Supabase | Imposible implementar trazabilidad y regla FEFO | 🔴 Alta |
| La estructura actual es un CRUD simple de productos, sin modelo transaccional | Cada operación sobreescribe datos en lugar de registrar un historial | 🔴 Alta |
| No están configuradas las políticas de **Row Level Security (RLS)** por rol | Cualquier usuario autenticado puede acceder a datos que no le corresponden | 🔴 Alta |
| El campo `roles` del usuario no está siendo validado a nivel de base de datos | El control de acceso depende solo del frontend, lo cual es inseguro | 🟡 Media |

### 6.2 Flujos de Negocio — Incompletos

| Flujo | Estado actual | Lo que falta |
|---|:---:|---|
| Flujo de donación | ⚠️ Parcial | El botón "Donar" existe en la UI pero no hay cambio de estados (`PENDIENTE → ACEPTADA → RECIBIDA`) ni notificación real a la ONG |
| Flujo de recepción e inspección | ❌ No existe | La ONG no tiene módulo para aceptar, rechazar o registrar inspección física |
| Gestión de inventario | ❌ No existe | No hay registro de movimientos tipo `ENTRADA`, `SALIDA`, `BAJA` |
| Manejo de alimentos próximos a vencer | ⚠️ Parcial | Solo hay visualización en el dashboard; falta el proceso batch automático diario |
| Distribución a beneficiarios | ❌ No existe | No hay módulo de asignación ni registro de movimientos tipo `SALIDA` |

### 6.3 Reglas de Negocio — Sin implementar

- **FEFO no está aplicado:** los productos en el dashboard no se ordenan por fecha de vencimiento como prioridad de distribución.
- **Sin validación de stock negativo:** el sistema no bloquea operaciones de salida que excedan el stock disponible.
- **El proceso batch de alertas no existe:** los niveles (🟢 Normal, 🟡 Próximo, 🔴 Crítico, ⛔ Vencido) no se recalculan automáticamente cada día.
- **No hay doble confirmación** en acciones sensibles (baja de lotes, ajuste manual de inventario).

### 6.4 Seguridad

- La expiración de tokens de sesión usa la configuración por defecto de Supabase; no ha sido ajustada a los requerimientos del sistema.
- El control de acceso por rol está implementado únicamente en el frontend (rutas protegidas), sin respaldo en las políticas de la base de datos.

---

## 7. Resumen Ejecutivo para el Equipo

### Estado general

El sistema cuenta con un **MVP funcional** que cubre la etapa de registro de usuarios, visualización básica de productos y listado de ONGs. Sin embargo, los módulos core del negocio (inventario transaccional, flujo de donación completo y distribución a beneficiarios) **aún no están implementados**.

### Prioridades antes de continuar con nuevas funcionalidades

PRIORIDAD 1 — Estructural (bloqueante)
├── Ajustar el esquema de base de datos en Supabase
│ ├── Crear tabla Batch (Lote)
│ └── Crear tabla InventoryMovement (Movimiento de Inventario)
└── Configurar políticas RLS por rol en Supabase
├── ADMINISTRADOR
├── ONG
├── DONANTE
└── BENEFICIARIO

PRIORIDAD 2 — Flujos core (dependientes de P1)
├── Implementar flujo de donación completo con cambio de estados
├── Implementar módulo de recepción e inspección para ONG
└── Implementar proceso batch diario de alertas por vencimiento

PRIORIDAD 3 — Nuevas funcionalidades (dependientes de P1 y P2)
├── Módulo de distribución a beneficiarios
├── Generación de certificados de donación (Ley 2380/2024)
└── Integración con Siigo / Alegra / Google Sheets


### Conclusión

> Sin resolver las prioridades 1 y 2, cualquier nueva funcionalidad construida sobre la base de datos actual quedará desconectada de la lógica de negocio real y generará mayor deuda técnica.
> **Se recomienda pausar el desarrollo de módulos secundarios** (panel administrativo, generador de PDFs, sistema de reputación) hasta tener el modelo de datos y los flujos core estables.
