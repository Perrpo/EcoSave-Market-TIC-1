# 📘 Historias de Usuario – EcoSave Market

Las historias de usuario describen las necesidades principales de cada actor del sistema: **Administrador, Supermercado y ONG**.

Formato usado:

> **Como [rol], quiero [acción], para [beneficio].**

---

## 👤 HU01 – Inicio de sesión por roles
**Como usuario del sistema (administrador, supermercado u ONG), quiero iniciar sesión con mis credenciales, para acceder al dashboard correspondiente a mi rol.**

### ✅ Criterios de aceptación
- Validar correo y contraseña.
- Identificar el rol del usuario.
- Redirigir al dashboard correcto.
- Mostrar error si las credenciales son inválidas.

---

## 🏪 HU02 – Registro de productos donables
**Como supermercado, quiero registrar productos próximos a vencer, para ponerlos a disposición de donación antes de que se desperdicien.**

### ✅ Criterios de aceptación
- Permitir nombre, cantidad y fecha de vencimiento.
- Almacenar el producto en base de datos.
- Mostrarlo como disponible.
- Actualizar el dashboard.

---

## 🏢 HU03 – Consulta de donaciones
**Como ONG, quiero visualizar las donaciones disponibles, para seleccionar los productos que mi organización necesita.**

### ✅ Criterios de aceptación
- Listar productos disponibles.
- Mostrar cantidad.
- Mostrar supermercado donante.
- Actualizarse tras nuevas donaciones.

---

## 📦 HU04 – Solicitud de donación
**Como ONG, quiero solicitar una donación disponible, para gestionar el retiro de productos necesarios para la comunidad.**

### ✅ Criterios de aceptación
- Permitir seleccionar una donación.
- Cambiar el estado de la solicitud.
- Reflejarse en el dashboard.
- Registrarse en historial.

---

## ✅ HU05 – Confirmación de recepción
**Como ONG, quiero confirmar la recepción de una donación, para dejar evidencia de que el producto fue entregado correctamente.**

### ✅ Criterios de aceptación
- Permitir confirmar desde historial.
- Cambiar el estado a recibido.
- Actualizar métricas.
- Mantener registro permanente.

---

## 📊 HU06 – Monitoreo administrativo
**Como administrador, quiero visualizar métricas generales del sistema, para supervisar el uso de la plataforma y la gestión de donaciones.**

### ✅ Criterios de aceptación
- Mostrar total de usuarios.
- Mostrar total de donaciones.
- Mostrar ONGs activas.
- Mostrar supermercados activos.

---

## 🔔 HU07 – Notificaciones
**Como usuario, quiero recibir notificaciones de cambios importantes, para mantenerme informado sobre solicitudes, confirmaciones y nuevas donaciones.**

### ✅ Criterios de aceptación
- Mostrar nuevas solicitudes.
- Mostrar confirmaciones.
- Mostrar cambios de estado.
- Permitir marcar como leídas.

---

# 🚀 Historias de Usuario – Próximo Sprint

Estas historias corresponden a mejoras planificadas para la siguiente iteración del proyecto.

---

## 🟡 HU08 – Solicitud parcial
**Como ONG, quiero solicitar una cantidad específica de una donación, para aprovechar solo lo necesario y dejar disponible el resto.**

### ✅ Criterios de aceptación
- Permitir ingresar cantidad solicitada.
- Validar que no supere el inventario disponible.
- Descontar únicamente la cantidad solicitada.
- Mantener el restante disponible.

---

## 🟡 HU09 – Comprobante PDF
**Como supermercado, quiero generar un comprobante de donación, para usarlo como soporte contable y tributario.**

### ✅ Criterios de aceptación
- Generar comprobante con fecha.
- Incluir productos y cantidades.
- Incluir ONG receptora.
- Descargar en PDF.

---

## 🟡 HU10 – Actualización en tiempo real
**Como usuario, quiero ver cambios automáticos sin recargar manualmente, para mejorar la coordinación entre actores.**

### ✅ Criterios de aceptación
- Reflejar cambios automáticamente.
- Mostrar nuevas solicitudes en vivo.
- Actualizar métricas sin recarga.
- Sincronizar dashboards.
