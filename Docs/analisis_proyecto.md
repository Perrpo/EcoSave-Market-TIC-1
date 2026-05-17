# Análisis Técnico del Proyecto — EcoSave Market

**Fecha:** 16 de mayo de 2026  
**Proyecto:** EcoSave Market — TIC 1  
**Universidad:** Universidad Pontificia Bolivariana, Medellín  
**Repositorio:** https://github.com/Perrpo/EcoSave-Market-TIC-1

---

## 1. Visión General

EcoSave Market es una plataforma web para reducir el desperdicio alimentario conectando supermercados con productos próximos a vencer y ONGs que necesitan alimentos. El proyecto se desarrolla en el curso TIC 1 de la UPB bajo una arquitectura por capas documentada.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| **Frontend** | React | 19.1.1 | Framework de UI |
| | TypeScript | 5.9.3 | Tipado estático |
| | Vite | 7.1.7 | Build tool + HMR |
| | React Router | 7.9.5 | Enrutamiento SPA |
| | React Compiler | 19.1.0-rc.3 | Optimización automática |
| **Backend** | AdonisJS | 6.18.0 | Framework HTTP |
| | TypeScript | 5.8 | Tipado estático |
| | @adonisjs/auth | 9.4.0 | Autenticación |
| | @adonisjs/lucid | 21.6.1 | ORM (instalado, no usado) |
| | @adonisjs/cors | 2.2.1 | Manejo de CORS |
| **Base de datos** | Supabase | — | PostgreSQL + Auth + RLS |
| | @supabase/supabase-js | 2.80.0 | SDK cliente |
| **Email** | Nodemailer | 7.0.10 | Envío SMTP |
| **PDF** | PDFKit | 0.17.2 | Generación de certificados |
| **Tareas** | node-cron | 4.2.1 | Trabajos programados |
| **Validación** | @vinejs/vine | 3.0.1 | Validación de inputs |

---

## 3. Arquitectura

El proyecto implementa una **arquitectura de 3 capas** con separación clara de responsabilidades:

```
┌──────────────────────────────────────┐
│   CAPA 1 — CONTROLADORES             │  Manejo HTTP, sin lógica de negocio
│   app/controllers/http/              │
└─────────────────┬────────────────────┘
                  │
┌─────────────────▼────────────────────┐
│   CAPA 2 — SERVICIOS                 │  Lógica de negocio y orquestación
│   app/services/                      │
└─────────────────┬────────────────────┘
                  │
┌─────────────────▼────────────────────┐
│   CAPA 3 — REPOSITORIOS              │  Acceso a datos (Supabase)
│   app/repositories/                  │
└─────────────────┬────────────────────┘
                  │
┌─────────────────▼────────────────────┐
│   INFRAESTRUCTURA — SUPABASE         │  PostgreSQL + Auth + RLS
└──────────────────────────────────────┘
```

### 3.1 Cobertura por dominio

Cada dominio tiene exactamente un triplete Controlador–Servicio–Repositorio:

| Dominio | Controller | Service | Repository |
|---------|-----------|---------|------------|
| Auth | ✅ | ✅ | ✅ |
| Producto | ✅ | ✅ | ✅ |
| Donación | ✅ | ✅ | ✅ |
| Orden | ✅ | ✅ | ✅ |
| Notificación | ✅ | ✅ | ✅ |
| Ubicación | ✅ | ✅ | ✅ |
| Usuario | ✅ (parcial) | ✅ | ✅ |

### 3.2 Frontend

**Páginas (5):** `Dashboard.tsx`, `DashboardONG.tsx`, `DashboardAdmin.tsx`, `Map.tsx`, `Notifications.tsx`  
**Contextos:** `AuthContext` (sesión y token) y `NotificationContext` (polling cada 30 s)  
**Servicios:** `api.ts` — cliente fetch centralizado (sin axios)

### 3.3 Esquema de base de datos

**Tablas:** `users`, `profiles`, `products`, `donations`, `locations`, `notifications`, `orders`, `email_logs`, `attachments`, `roles`

Patrones de diseño usados:
- RLS (Row Level Security) para aislamiento de datos por usuario
- Columnas JSONB para especialidades de ONGs y lista de productos en órdenes
- Enumeraciones de estado (`estado`, `status`) para manejar ciclos de vida

---

## 4. Flujo Principal — Donaciones

```
Supermercado registra producto
        ↓
Sistema calcula urgencia (Normal / Advertencia / Urgente / Vencido)
        ↓
Publicado como donación "available"
        ↓
ONG filtra y solicita  →  Estado: "requested"
        ↓
Supermercado recibe notificación
        ↓
ONG confirma recibo   →  Estado: "completed"
        ↓
Ambas partes ven historial + notificaciones
```

### Cálculo de urgencia

| Estado | Días restantes |
|--------|---------------|
| Vencido | < 0 |
| Urgente | 0 – 2 |
| Advertencia | 3 – 5 |
| Normal | > 5 |

---

## 5. Problemas Identificados

### 🔴 Críticos

**C-1: Credenciales expuestas en el repositorio**
- **Ubicación:** `.env.example`
- **Impacto:** Las llaves reales de Supabase y la contraseña de Gmail son visibles para cualquiera con acceso al repo.
- **Fix:** Reemplazar todos los valores en `.env.example` con placeholders (`your-key-here`). Rotar las credenciales actuales.

**C-2: Middleware de autenticación comentado**
- **Ubicación:** `start/routes.ts`, líneas 70–72
- **Impacto:** Las rutas de estado (logout, protegidas) no validan el JWT entrante.
- **Fix:** Descomentar el middleware de auth y aplicarlo a todos los grupos de rutas que modifiquen datos.

**C-3: ORM Lucid instalado pero no usado**
- **Ubicación:** `package.json` — `@adonisjs/lucid` 21.6.1
- **Impacto:** ~5 MB de dependencia innecesaria, superficie de ataque adicional, confusión al onboarding.
- **Fix:** `npm uninstall @adonisjs/lucid` y eliminar cualquier import residual.

**C-4: Sistema de órdenes desconectado del flujo de donaciones**
- **Impacto:** Existen dos flujos paralelos (`orders` y `donations`) sin integración clara. Puede generar inconsistencia de datos.
- **Fix:** Documentar explícitamente si son flujos separados o consolidarlos.

---

### 🟡 Moderados

**M-1: URL base de la API hardcodeada**
- **Ubicación:** `frontend-app/src/services/api.ts`, línea 1 — `http://localhost:3333/api/v1`
- **Fix:** Usar variable de entorno Vite: `import.meta.env.VITE_API_URL`

**M-2: Polling HTTP para notificaciones en tiempo real**
- **Ubicación:** `NotificationContext.tsx`, intervalo de 30 s
- **Impacto:** Latencia alta, carga innecesaria al servidor.
- **Fix:** Migrar a Supabase Realtime (WebSocket nativo del SDK) o Server-Sent Events.

**M-3: Dashboard de administrador sin integración backend**
- **Ubicación:** `DashboardAdmin.tsx`
- **Impacto:** El rol `admin` no puede ver métricas reales del sistema.

**M-4: Sin validación de inputs con Vine**
- **Impacto:** Los controladores reciben datos sin validar (formato de email, teléfono, NIT, etc.).
- **Fix:** Crear schemas Vine en cada controlador para todos los endpoints de mutación.

**M-5: `UserController` incompleto**
- **Impacto:** No existen endpoints para actualizar o eliminar usuarios ni para gestionar perfil.

**M-6: Respuestas de error inconsistentes**
- **Impacto:** Algunos endpoints devuelven `{ error: {...} }`, otros `{ message: '...' }`. El frontend debe manejar múltiples formatos.
- **Fix:** Crear un helper `HttpResponse` o usar el error handler global de AdonisJS de forma uniforme.

**M-7: CORS abierto a cualquier origen**
- **Ubicación:** `config/cors.ts` — `origin: true`
- **Fix:** Especificar orígenes permitidos: `origin: ['http://localhost:5173']` en desarrollo, dominio real en producción.

---

### 🟢 Menores

**m-1: Cero cobertura de tests**
- El directorio `/backend-app/tests` existe pero está vacío.
- **Fix:** Escribir al menos tests unitarios para los servicios y tests de integración para el flujo de donaciones.

**m-2: Magic strings para estados**
- Los valores `'available'`, `'requested'`, `'completed'` están dispersos en todo el código.
- **Fix:** Crear un archivo `app/constants/enums.ts` con los valores centralizados.

**m-3: Sin estrategia de logging**
- Solo se usa `console.log`. No hay niveles, trazas ni integración con herramientas externas.
- **Fix:** Usar el logger integrado de AdonisJS (`this.logger`) y configurar un transporte (Winston, Pino) para producción.

**m-4: Sin rate limiting**
- Los endpoints de autenticación no tienen protección contra fuerza bruta.
- **Fix:** Agregar middleware de rate limit (p. ej., `limiter` de AdonisJS o `express-rate-limit` adaptado).

**m-5: Versión del proyecto en 0.0.0**
- **Fix:** Aplicar versionado semántico desde el MVP (e.g., `0.1.0`).

**m-6: Sin documentación de API (OpenAPI/Swagger)**
- **Fix:** Integrar `@adonisjs/swagger` o auto-generar desde los controladores.

---

## 6. Análisis de Seguridad

| Área | Estado | Detalle |
|------|--------|---------|
| RLS en Supabase | ✅ | Aislamiento de datos por rol implementado |
| Hash de contraseñas | ✅ | Delegado a Supabase Auth |
| Llaves de servicio en frontend | ✅ | No expuestas |
| JWT / sesión | ⚠️ | localStorage es vulnerable a XSS si se inyecta script |
| Credenciales en repo | ❌ | `.env.example` con valores reales |
| Auth middleware | ❌ | Comentado en rutas |
| Validación de inputs | ❌ | Sin validación en controladores |
| CORS | ❌ | Acepta cualquier origen |
| Rate limiting | ❌ | Sin protección |
| CSRF | ❌ | Sin tokens de protección |

**Puntuación de seguridad estimada: 4 / 10**

---

## 7. Análisis de Calidad de Código

### Fortalezas
- Separación de responsabilidades consistente en toda la base de código
- Convenciones de nomenclatura claras y coherentes
- Documentación de arquitectura detallada (`arquitectura-por-capas.md`)
- Patrón Singleton para servicios sin estado
- TypeScript aplicado tanto en frontend como en backend

### Debilidades
- Sin tests (0% cobertura)
- Magic strings para enumeraciones de estado
- Sin archivo de constantes compartidas
- Gestión de estado en frontend solo con Context API (sin React Query / SWR)
- Sin estrategia de logging
- Sin manejo de errores estandarizado

**Puntuación de mantenibilidad: 7 / 10**

---

## 8. Análisis de Rendimiento

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Vite + HMR | ✅ | Builds rápidos en desarrollo |
| React Compiler | ✅ | Memoización automática |
| Paginación en API | ✅ | Soporte `limit/offset` implementado |
| Polling 30 s | ❌ | Desperdicia ancho de banda y CPU del servidor |
| Sin caché en frontend | ❌ | Cada renderizado recarga desde el servidor |
| Riesgo N+1 queries | ⚠️ | Algunos servicios podrían hacer llamadas redundantes |

---

## 9. Casos de Borde No Manejados

| Caso | Impacto |
|------|---------|
| ONG solicita cantidad parcial (< total disponible) | No soportado |
| Fecha de vencimiento pasa mientras la donación está "requested" | No hay manejo automático |
| ONG cancela después de solicitar | No hay endpoint de cancelación |
| Expiración automática de donaciones vencidas | No implementado |
| Redistribución a siguiente ONG si la primera declina | No implementado |

---

## 10. Características Faltantes (del Roadmap)

Del `README.md` y documentación interna:

| Característica | Estado |
|---------------|--------|
| Solicitudes parciales (cantidad < total) | ❌ Pendiente |
| Dashboard de admin con métricas reales | ⚠️ Rutas creadas, sin backend |
| Redistribución inteligente entre ONGs | ❌ Pendiente |
| Certificado PDF de donación | ❌ Pendiente (PDFKit instalado) |
| Notificaciones en tiempo real (WebSocket) | ❌ Solo polling |
| Gestión de perfil de usuario | ❌ Sin endpoints |

---

## 11. Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| Archivos TypeScript totales | ~59 |
| Controladores (backend) | 8 |
| Servicios (backend) | 12 |
| Repositorios (backend) | 8 |
| Páginas (frontend) | 5 |
| Endpoints API | 50+ |
| Tablas en BD | 10 |
| Líneas de código (backend) | ~3.500 |
| Líneas de código (frontend) | ~2.500 |
| Cobertura de tests | 0 % |
| Dependencias totales | ~42 |

---

## 12. Plan de Mejoras Recomendado

### Fase 1 — Seguridad (Semana 1)
1. Eliminar credenciales reales de `.env.example` y rotar llaves comprometidas
2. Descomentar e implementar middleware de autenticación en todas las rutas protegidas
3. Implementar validadores Vine en todos los controladores
4. Restringir CORS a orígenes específicos
5. Eliminar la dependencia `@adonisjs/lucid` no utilizada
6. Agregar rate limiting en endpoints de autenticación

### Fase 2 — Estabilidad (Semana 2)
7. Centralizar manejo de errores con respuestas uniformes
8. Crear `app/constants/enums.ts` para todos los magic strings
9. Implementar logging estructurado (logger de AdonisJS + transporte)
10. Escribir tests unitarios para servicios (objetivo: 80% cobertura)
11. Agregar tests de integración para el flujo de donaciones
12. Usar variable de entorno para la URL base de la API en el frontend

### Fase 3 — Funcionalidades (Semana 3)
13. Migrar notificaciones a Supabase Realtime (WebSocket)
14. Completar dashboard de administrador con datos reales
15. Implementar endpoints de perfil de usuario (actualizar, eliminar)
16. Soportar solicitudes parciales de donación
17. Implementar manejo automático de donaciones expiradas
18. Generar certificados PDF de donación completada

### Fase 4 — Operaciones (Ongoing)
19. Configurar pipeline CI/CD con GitHub Actions
20. Agregar monitoreo y alertas (Sentry / LogRocket)
21. Configurar backups automáticos de la base de datos
22. Configurar entorno de staging separado
23. Generar documentación de API con Swagger/OpenAPI
24. Aplicar versionado semántico

---

## 13. Conclusión

**EcoSave Market** es un proyecto académico bien estructurado con arquitectura clara, documentación sólida y separación de responsabilidades consistente. El flujo de donaciones principal está completamente implementado y funcional.

Sin embargo, **no está listo para producción** debido principalmente a:
1. Credenciales expuestas en el repositorio
2. Middleware de autenticación desactivado
3. Ausencia total de validación de inputs
4. Cero cobertura de tests
5. Configuración incorrecta de CORS

**Para entrega académica:** ✅ Excelente — arquitectura comprensible, código ordenado, funcionalidad central completa.

**Para despliegue en producción:** ❌ Requiere 2–3 semanas de hardening enfocadas en seguridad, estabilidad y testing.

**Puntuación global estimada: 7.5 / 10**

---

*Generado el 16 de mayo de 2026*
