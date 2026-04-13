# 🌱 EcoSave Market

**EcoSave Market** es una plataforma web orientada a la **reducción del desperdicio de alimentos próximos a vencer**, conectando **supermercados, ONGs y administradores** en un mismo ecosistema digital.

La solución permite publicar productos aptos para donación, gestionar solicitudes por parte de ONGs, confirmar la recepción y mantener trazabilidad del proceso mediante dashboards por rol.

---

# 🎯 Objetivo del proyecto

Desarrollar una plataforma web que facilite la **gestión de donaciones de alimentos próximos a vencer**, reduciendo pérdidas económicas, promoviendo la economía circular y fortaleciendo la seguridad alimentaria.

---

# 👥 Roles del sistema

## 👤 Administrador

* Gestiona usuarios
* Supervisa métricas generales
* Monitorea donaciones
* Visualiza actividad global del sistema

## 🏪 Supermercado

* Registra productos próximos a vencer
* Publica productos para donación
* Consulta solicitudes de ONGs
* Gestiona inventario disponible

## 🏢 ONG

* Consulta donaciones disponibles
* Solicita productos
* Confirma recepción
* Consulta historial
* Recibe notificaciones

---

# ✨ Funcionalidades actuales

## 🔐 Autenticación por roles

* Inicio de sesión
* Redirección automática según rol
* Manejo de sesión

## 📦 Gestión de donaciones

* Registro de productos
* Publicación de donaciones
* Consulta de disponibilidad
* Solicitud por parte de ONGs
* Confirmación de recepción

## 📊 Dashboard por rol

* Dashboard ONG funcional
* Dashboard supermercado
* Dashboard administrador (fase parcial)
* Métricas dinámicas
* Historial de solicitudes

## 🔔 Notificaciones

* Nuevas solicitudes
* Confirmaciones
* Cambios de estado

---

# 🏗️ Arquitectura del proyecto

## Frontend

* **React + TypeScript**
* Componentes reutilizables
* Dashboard modular por roles
* UI responsiva

## Backend / Persistencia

* **Supabase**
* Autenticación
* Base de datos
* Persistencia de solicitudes
* Historial

---

# 📂 Estructura general del proyecto

```bash
src/
 ├── components/
 ├── pages/
 │    ├── DashboardAdmin.tsx
 │    ├── DashboardONG.tsx
 │    └── DashboardSupermarket.tsx
 ├── services/
 ├── hooks/
 ├── types/
 └── App.tsx
```

---

# 🔁 Flujo principal del sistema

1. El supermercado registra productos próximos a vencer.
2. Los productos se publican como disponibles para donación.
3. La ONG consulta las donaciones.
4. La ONG solicita productos.
5. El sistema actualiza dashboard e historial.
6. La ONG confirma la recepción.
7. El proceso queda registrado para trazabilidad.

---

# 📘 Historias de usuario implementadas

* HU01 – Inicio de sesión por roles
* HU02 – Registro de productos donables
* HU03 – Consulta de donaciones
* HU04 – Solicitud de donación
* HU05 – Confirmación de recepción
* HU06 – Monitoreo administrativo
* HU07 – Notificaciones

---

# 🚀 Roadmap / Próximas mejoras

## 🟡 Solicitudes parciales

Permitir que una ONG solicite una cantidad específica de una donación.

## 📄 Comprobante PDF

Generar soporte formal de donación para fines contables y tributarios.

## ⚡ Tiempo real real

Integración con **Supabase Realtime / WebSockets** para sincronización automática.

## 📈 Dashboard administrativo real

Reemplazar métricas simuladas por datos reales del backend.

## 🤖 Redistribución inteligente

Asignación automática de sobrantes a otras ONGs.

---

# 🎨 Diseño

* Interfaz moderna basada en dashboards
* Navegación por sidebar
* Tarjetas de métricas
* Historial visual
* Panel de notificaciones
* Responsive design
* Separación clara por actor

---

# 🌍 Impacto esperado

* Reducir desperdicio alimentario
* Optimizar inventario en supermercados
* Facilitar acceso a alimentos para ONGs
* Mejorar trazabilidad de donaciones
* Fortalecer responsabilidad social empresarial

---

# 📌 Estado actual del proyecto

✅ Flujo ONG funcional
✅ Roles implementados
✅ Solicitudes operativas
✅ Historial persistente
✅ Métricas por dashboard
🟡 Admin parcialmente conectado
🟡 Solicitud parcial pendiente
🟡 Comprobante PDF pendiente

---

# 👨‍💻 Equipo

Proyecto académico orientado a transformación digital, economía circular y reducción del desperdicio de alimentos.
