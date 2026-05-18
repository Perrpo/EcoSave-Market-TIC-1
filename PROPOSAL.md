# EcoSave Market – Documento Completo de la Propuesta

## 📋 Información General

- **Nombre del proyecto:** EcoSave Market – Plataforma Anti-Desperdicio de Alimentos
- **Tipo de proyecto:** Plataforma web orientada a transformación digital, economía circular y gestión de donaciones alimentarias.
- **Área de aplicación:**
  - Sector alimentario
  - Responsabilidad social empresarial
  - Gestión de inventarios
  - Economía circular
  - Seguridad alimentaria

---

## 🌍 Problemática

El desperdicio de alimentos representa una de las problemáticas sociales y ambientales más importantes del sector alimentario. Supermercados, restaurantes y cadenas de alimentos descartan diariamente productos próximos a vencer que todavía son aptos para el consumo.

**Esto genera:**
- Pérdidas económicas para los negocios.
- Incremento de residuos orgánicos.
- Impacto ambiental.
- Desaprovechamiento de alimentos útiles.
- Dificultad para organizaciones sociales de acceder a alimentos.

Actualmente, muchas donaciones se realizan mediante procesos manuales (llamadas telefónicas, mensajes, correos, coordinación informal), lo que provoca:
- Poca trazabilidad.
- Mala organización.
- Desperdicio innecesario.
- Falta de control de inventario.
- Ausencia de evidencia documental.

**EcoSave Market** busca solucionar esta problemática mediante una plataforma digital que permita centralizar el proceso de donación entre supermercados y ONGs.

---

## 🎯 Objetivo General

Desarrollar una plataforma web que conecte supermercados, ONGs y administradores para gestionar donaciones de alimentos próximos a vencer, reducir el desperdicio alimentario y mejorar la trazabilidad del proceso mediante dashboards y control digital de solicitudes.

### 🎯 Objetivos Específicos
1. Implementar autenticación y control de acceso por roles.
2. Gestionar productos próximos a vencer dentro de la plataforma.
3. Permitir la interacción entre supermercados y ONGs mediante solicitudes de donación.
4. Visualizar información y métricas mediante dashboards diferenciados.
5. Mantener trazabilidad e historial de las donaciones realizadas.

---

## 👥 Actores del Sistema

### 🏪 Supermercado
Es el actor principal encargado de registrar y administrar productos próximos a vencer dentro de la plataforma.

**Funciones principales:**
- Registrar productos próximos a vencer.
- Publicar productos para donación.
- Gestionar inventario disponible.
- Consultar solicitudes realizadas por ONGs.
- Confirmar disponibilidad de productos.
- Actualizar cantidades disponibles.
- Visualizar métricas de donaciones.
- Mantener historial de productos publicados.
- Gestionar estado de productos.
- Recibir notificaciones de solicitudes.

**Beneficios para el supermercado:**
- Reducir pérdidas económicas.
- Evitar desperdicio innecesario.
- Mejorar gestión de inventario.
- Facilitar procesos de donación.
- Fortalecer responsabilidad social empresarial.
- Mantener trazabilidad de donaciones.
- Posibilidad de soporte documental para beneficios tributarios.

**Acciones dentro de la plataforma:**
- Crear publicaciones de donación.
- Editar productos.
- Eliminar productos.
- Consultar solicitudes activas.
- Ver historial de donaciones.
- Visualizar estadísticas básicas.
- Gestionar disponibilidad restante.

### 🏢 ONG
Es el actor encargado de solicitar, gestionar y confirmar la recepción de alimentos donados.

**Funciones principales:**
- Consultar productos disponibles.
- Solicitar productos donados.
- Confirmar recepción de donaciones.
- Visualizar historial de solicitudes.
- Consultar estado de solicitudes.
- Recibir notificaciones.
- Visualizar métricas de donaciones recibidas.
- Gestionar seguimiento de solicitudes.

**Beneficios para la ONG:**
- Acceso rápido a alimentos disponibles.
- Mejor organización de solicitudes.
- Reducción de tiempos de coordinación.
- Mayor trazabilidad de ayudas recibidas.
- Facilidad para identificar productos disponibles.
- Centralización de información.
- Mejor control de recepción de alimentos.

**Acciones dentro de la plataforma:**
- Consultar catálogo de donaciones.
- Solicitar productos.
- Confirmar entregas.
- Consultar historial.
- Revisar notificaciones.
- Ver productos disponibles en tiempo real.
- Gestionar solicitudes activas.

---

## 🛠 Arquitectura y Tecnología

**Backend y Persistencia:**
Tecnología principal: **Supabase** (Base de datos PostgreSQL + Auth) / **AdonisJS**

**Funcionalidades Técnicas:**
- Autenticación.
- Persistencia de datos.
- Manejo de usuarios.
- Gestión de historial.
- Manejo de solicitudes.
- Interfaz responsive.
- Sistema de métricas.

---

## 📦 Funcionalidades Implementadas

### 🔐 Autenticación
- Inicio de sesión.
- Validación de credenciales.
- Redirección según rol.
- Persistencia de sesión.

### 📦 Gestión de Productos
- Registro de productos.
- Visualización de productos.

### 📊 Módulo ONG
- Donaciones disponibles.
- Solicitudes pendientes.
- Recepciones confirmadas.
- Historial.
- Métricas.
- Notificaciones.

### 🏪 Dashboard Supermercado
- Registro de productos.
- Gestión de inventario.
- Publicación de donaciones.
- Consulta de solicitudes.

---

## 📘 Historias de Usuario

- **HU01 – Inicio de sesión:** Como usuario, quiero iniciar sesión para acceder al sistema según mi rol.
- **HU02 – Registro de productos:** Como supermercado, quiero registrar productos próximos a vencer para evitar desperdicios.
- **HU03 – Consulta de donaciones:** Como ONG, quiero consultar donaciones disponibles para solicitar productos necesarios.
- **HU04 – Solicitud de donaciones:** Como ONG, quiero solicitar productos para gestionar ayudas alimentarias.
- **HU05 – Confirmación de recepción:** Como ONG, quiero confirmar la recepción para mantener trazabilidad.
- **HU07 – Notificaciones:** Como usuario, quiero recibir notificaciones para mantenerme informado.

---

## ⚙️ Requerimientos Funcionales
- **RF01:** El sistema debe permitir autenticación de usuarios.
- **RF02:** El sistema debe diferenciar usuarios por roles.
- **RF03:** El supermercado debe registrar productos.
- **RF04:** La ONG debe consultar productos disponibles.
- **RF05:** La ONG debe solicitar donaciones.
- **RF06:** La ONG debe confirmar recepción.
- **RF07:** El sistema debe mostrar historial.
- **RF08:** El administrador debe visualizar métricas.
- **RF09:** El sistema debe mostrar notificaciones.

---

## 🔒 Requerimientos No Funcionales
- **RNF01:** El sistema debe responder rápidamente después de cada acción.
- **RNF02:** El sistema debe proteger sesiones y autenticación.
- **RNF03:** La interfaz debe ser responsive.
- **RNF04:** La arquitectura debe ser modular.
- **RNF05:** El sistema debe soportar múltiples actores.
- **RNF06:** La navegación debe ser intuitiva.

---

## 🔁 Flujo General del Sistema
1. El usuario inicia sesión.
2. El sistema valida el rol.
3. El supermercado registra productos.
4. Los productos quedan disponibles.
5. La ONG consulta donaciones.
6. La ONG solicita productos.
7. El sistema actualiza dashboards.
8. La ONG confirma recepción.
9. El sistema almacena historial.

---

## 📊 Dashboards

### Dashboard ONG
**Características:**
- Métricas dinámicas.
- Historial.
- Panel de solicitudes.
- Confirmación de recepción.
- Notificaciones.

### Dashboard Supermercado
**Características:**
- Publicación de donaciones.
- Gestión de inventario.
- Visualización y gestión de solicitudes.

---

## 🎨 Diseño del Sistema

**Estilo visual:**
- Diseño moderno.
- Dashboard orientado a métricas.
- Navegación lateral.
- Tarjetas informativas.
- Componentes reutilizables.
- Responsive design.

**Objetivo del diseño:** Facilitar el acceso rápido a la información crítica para cada actor.

---

## 🧠 Lógica de Negocio
- **Publicación de Donaciones:** Los supermercados publican productos próximos a vencer.
- **Solicitud:** Las ONGs pueden solicitar productos disponibles.
- **Confirmación:** La ONG confirma la recepción.
- **Historial:** Toda acción queda almacenada.
- **Trazabilidad:** El sistema mantiene evidencia del flujo de donaciones.

---

## 📈 Impacto Esperado

**Social:**
- Facilitar acceso a alimentos.
- Fortalecer apoyo a comunidades.
- Incrementar eficiencia de ONGs.

**Económico:**
- Reducir pérdidas.
- Optimizar inventario.
- Mejorar gestión de productos.

**Ambiental:**
- Reducir desperdicio.
- Disminuir residuos orgánicos.
- Fomentar la economía circular.

---

## 📌 Estado Actual

**Completado:** ✅ Login. ✅ Dashboard ONG. ✅ Dashboard supermercado. ✅ Solicitudes. ✅ Historial. ✅ Notificaciones. ✅ Persistencia. ✅ Arquitectura modular.

**Pendiente:**
- 🟡 Solicitudes parciales.
- 🟡 Dashboard admin conectado completamente.
- 🟡 Generación de comprobantes PDF (En optimización final).
- 🟡 Integración realtime completa.
- 🟡 Redistribución automática de sobrantes.

---

## 🎯 Conclusión

EcoSave Market representa una solución tecnológica orientada a la reducción del desperdicio alimentario mediante la transformación digital de procesos de donación. Actualmente el sistema ya cuenta con una arquitectura funcional basada en roles, dashboards y trazabilidad de solicitudes.

El proyecto ya superó la etapa de prototipo básico y se encuentra en una fase de consolidación funcional y mejora de reglas de negocio.

La propuesta tiene potencial de escalabilidad y puede convertirse en una herramienta útil para conectar actores sociales y comerciales en torno a la economía circular y la seguridad alimentaria.
