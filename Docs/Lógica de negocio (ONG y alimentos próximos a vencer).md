# Documentación de Lógica de Negocio — Sistema de Gestión ONG y Alimentos


---

## Tabla de Contenidos

1. [Actores del Sistema](#1-actores-del-sistema)
2. [Flujos de Negocio](#2-flujos-de-negocio)
   - 2.1 [Flujo de Donación de Alimentos](#21-flujo-de-donación-de-alimentos)
   - 2.2 [Flujo de Recepción y Almacenamiento](#22-flujo-de-recepción-y-almacenamiento)
   - 2.3 [Gestión de Inventario](#23-gestión-de-inventario)
   - 2.4 [Manejo de Alimentos Próximos a Vencer](#24-manejo-de-alimentos-próximos-a-vencer)
   - 2.5 [Flujo de Asignación y Distribución](#25-flujo-de-asignación-y-distribución)
3. [Reglas de Negocio](#3-reglas-de-negocio)
   - 3.1 [Priorización por Fecha de Vencimiento](#31-priorización-por-fecha-de-vencimiento)
   - 3.2 [Condiciones de Disponibilidad y Publicación](#32-condiciones-de-disponibilidad-y-publicación)
   - 3.3 [Restricciones y Permisos por Rol](#33-restricciones-y-permisos-por-rol)
   - 3.4 [Validaciones de Seguridad y Trazabilidad](#34-validaciones-de-seguridad-y-trazabilidad)
4. [Entidades del Sistema](#4-entidades-del-sistema)
5. [Diagramas](#5-diagramas)
   - 5.1 [Diagrama de Flujo de Procesos](#51-diagrama-de-flujo-de-procesos)
   - 5.2 [Diagrama de Casos de Uso](#52-diagrama-de-casos-de-uso)
   - 5.3 [Borrador del Modelo Entidad-Relación](#53-borrador-del-modelo-entidad-relación)
6. [Glosario](#6-glosario)
7. [Diagnóstico del Estado Actual del Desarrollo](#7-diagnóstico-del-estado-actual-del-desarrollo)
   - 7.1 [Arquitectura Técnica Implementada](#71-arquitectura-técnica-implementada)
   - 7.2 [Módulos Actualmente Implementados](#72-módulos-actualmente-implementados)
   - 7.3 [Brechas frente a la Lógica de Negocio Documentada](#73-brechas-frente-a-la-lógica-de-negocio-documentada)
   - 7.4 [Resumen para el Equipo](#74-resumen-para-el-equipo)
     
---

## 1. Actores del Sistema

El sistema reconoce cuatro actores principales, cada uno con responsabilidades y permisos diferenciados. El modelo soporta **multi-rol**, lo que significa que un usuario puede desempeñar más de un rol simultáneamente dentro de la plataforma.

---

### 1.1 ONG (Organización No Gubernamental)

**Descripción:**  
Entidad jurídica o colectivo sin fines de lucro que gestiona la recepción, almacenamiento y distribución de alimentos donados hacia los beneficiarios finales.

**Responsabilidades:**
- Registrarse y mantener su perfil institucional actualizado en la plataforma.
- Publicar sus necesidades de alimentos y disponibilidad de espacio en bodega.
- Recibir donaciones de alimentos de donantes.
- Administrar el inventario de alimentos bajo su custodia.
- Priorizar y distribuir alimentos a beneficiarios según reglas de negocio.
- Generar reportes de trazabilidad y distribución.

**Atributos representativos:**
- Nombre legal, NIT/RUT, dirección, contacto.
- Capacidad de almacenamiento (m³ o unidades).
- Zonas geográficas de cobertura.
- Estado de verificación (pendiente, verificada, suspendida).

---

### 1.2 Donantes

**Descripción:**  
Persona natural o jurídica (empresa, supermercado, restaurante, particular) que entrega alimentos excedentes o próximos a vencer para su redistribución.

**Responsabilidades:**
- Registrar donaciones indicando tipo de alimento, cantidad, lote y fecha de vencimiento.
- Coordinar la entrega física con la ONG receptora.
- Consultar el historial y estado de sus donaciones.

**Atributos representativos:**
- Tipo: persona natural o empresa.
- Nombre, identificación, dirección, contacto.
- Historial de donaciones y volumen acumulado.

---

### 1.3 Beneficiarios

**Descripción:**  
Personas naturales o grupos (familias, comedores comunitarios, hogares) que reciben los alimentos distribuidos por las ONG.

**Responsabilidades:**
- Registrarse en el sistema con datos básicos de identificación.
- Recibir asignaciones de alimentos según disponibilidad y criterios de prioridad.
- Confirmar la recepción de los alimentos entregados.

**Atributos representativos:**
- Nombre, identificación, número de personas en núcleo familiar.
- Condición de vulnerabilidad (criterio de priorización).
- Historial de recepciones.

---

### 1.4 Administradores

**Descripción:**  
Usuarios internos con acceso elevado que supervisan, configuran y auditan el sistema en su totalidad.

**Responsabilidades:**
- Aprobar o rechazar registros de ONG, donantes y beneficiarios.
- Configurar reglas globales del sistema (umbrales de vencimiento, categorías de alimentos, etc.).
- Auditar movimientos de inventario y detectar irregularidades.
- Gestionar roles y permisos de usuarios.
- Generar reportes globales de impacto y operación.

---

## 2. Flujos de Negocio

### 2.1 Flujo de Donación de Alimentos

**Objetivo:** Registrar la intención de donación del donante y formalizar la transferencia de alimentos a una ONG.

**Precondiciones:**
- El donante debe estar registrado y activo en el sistema.
- Al menos una ONG verificada debe estar disponible para recibir donaciones.

**Pasos del flujo:**

```
1. El Donante inicia sesión en el sistema.
2. Selecciona "Nueva Donación".
3. Completa el formulario:
   - Tipo de alimento y categoría.
   - Cantidad (unidades, kg, litros).
   - Fecha de vencimiento y número de lote.
   - Condición del alimento (sellado, abierto, refrigerado, etc.).
   - Fecha estimada de entrega.
4. El sistema valida:
   - Fecha de vencimiento >= fecha actual + umbral mínimo configurable.
   - Datos obligatorios completos.
5. El sistema sugiere ONG disponibles según:
   - Capacidad de almacenamiento.
   - Zona geográfica.
   - Tipo de alimento aceptado por la ONG.
6. El Donante selecciona la ONG receptora y confirma.
7. El sistema crea el registro de Donación en estado "PENDIENTE".
8. Se notifica a la ONG seleccionada.
9. La ONG acepta o rechaza la donación:
   - Si acepta → Estado pasa a "ACEPTADA". Se programa entrega.
   - Si rechaza → Estado pasa a "RECHAZADA". El donante puede reasignar a otra ONG.
10. Al momento de entrega física, la ONG confirma recepción:
    → Estado pasa a "RECIBIDA". Se activa el flujo de recepción y almacenamiento.
```

**Estados de una Donación:**

| Estado       | Descripción                                              |
|--------------|----------------------------------------------------------|
| `PENDIENTE`  | Registrada, en espera de aceptación por la ONG           |
| `ACEPTADA`   | ONG confirmó disponibilidad para recibir                 |
| `RECHAZADA`  | ONG no puede recibir; el donante puede reasignar         |
| `RECIBIDA`   | Alimentos entregados físicamente y verificados           |
| `CANCELADA`  | Cancelada por el donante antes de la recepción           |

---

### 2.2 Flujo de Recepción y Almacenamiento

**Objetivo:** Registrar formalmente en el inventario los alimentos recibidos de una donación aceptada.

**Precondiciones:**
- La donación debe estar en estado `ACEPTADA`.
- La ONG receptora debe tener capacidad de almacenamiento disponible.

**Pasos del flujo:**

```
1. La ONG accede al listado de donaciones "ACEPTADAS" pendientes de recepción.
2. Selecciona la donación a recibir.
3. Realiza inspección física del alimento:
   - Verifica cantidad real contra cantidad declarada.
   - Confirma o corrige la fecha de vencimiento.
   - Evalúa el estado del producto (apto, con observaciones, no apto).
4. Si el alimento NO es apto → se registra como "RECHAZADO EN RECEPCIÓN" con motivo.
5. Si el alimento es apto (o apto con observaciones):
   a. El sistema crea o actualiza un Lote de alimentos.
   b. Se genera un Movimiento de Inventario de tipo "ENTRADA".
   c. El stock del alimento en la ONG se incrementa.
   d. La donación pasa a estado "RECIBIDA".
6. El sistema recalcula alertas de vencimiento del inventario actualizado.
```

**Regla especial:** Si la cantidad recibida difiere de la donada, se registran ambas cantidades. La diferencia queda documentada en el movimiento de inventario para trazabilidad.

---

### 2.3 Gestión de Inventario

**Objetivo:** Mantener un registro preciso y en tiempo real de los alimentos disponibles en cada ONG.

**Operaciones del inventario:**

| Operación          | Tipo de Movimiento | Descripción                                         |
|--------------------|--------------------|-----------------------------------------------------|
| Recepción          | `ENTRADA`          | Alimentos recibidos por donación                    |
| Distribución       | `SALIDA`           | Alimentos entregados a beneficiarios                |
| Merma / Baja       | `BAJA`             | Alimentos vencidos o en mal estado, retirados       |
| Ajuste de stock    | `AJUSTE`           | Corrección manual autorizada por administrador      |
| Transferencia      | `TRANSFERENCIA`    | Movimiento entre bodegas o sedes de la misma ONG    |

**Reglas de inventario:**
- El stock nunca puede ser negativo. El sistema debe bloquear operaciones de salida que excedan el stock disponible.
- Cada movimiento debe quedar trazado con: usuario responsable, fecha/hora, cantidad, lote afectado y motivo.
- El stock disponible se calcula como:  
  `Stock disponible = Entradas - Salidas - Bajas ± Ajustes`

---

### 2.4 Manejo de Alimentos Próximos a Vencer

**Objetivo:** Garantizar que los alimentos con menor vida útil sean priorizados en la distribución y evitar pérdidas por vencimiento.

**Umbrales de alerta (configurables por el Administrador):**

| Nivel de Alerta | Días restantes para vencer | Acción sugerida                           |
|-----------------|---------------------------|-------------------------------------------|
| 🟢 Normal        | > 30 días                 | Sin acción especial                       |
| 🟡 Próximo       | 8–30 días                 | Notificar a la ONG; priorizar distribución|
| 🔴 Crítico       | 1–7 días                  | Alerta urgente; distribución inmediata    |
| ⛔ Vencido       | 0 días o fecha pasada     | Dar de baja automáticamente del inventario|

**Proceso automatizado:**

```
Diariamente (proceso batch):
  Para cada Lote en el inventario:
    1. Calcular días_restantes = fecha_vencimiento - fecha_hoy.
    2. Actualizar el nivel de alerta del Lote.
    3. Si días_restantes <= 0 → cambiar estado a "VENCIDO".
       → Generar Movimiento de tipo "BAJA" automático.
       → Notificar a la ONG.
    4. Si días_restantes entre 1–30 → enviar notificación a la ONG.
    5. Reordenar la cola de distribución según prioridad FEFO
       (First Expired, First Out).
```

---

### 2.5 Flujo de Asignación y Distribución

**Objetivo:** Asignar los alimentos disponibles a beneficiarios registrados y registrar la entrega efectiva.

**Precondiciones:**
- Beneficiario registrado y activo.
- Stock disponible en el inventario de la ONG.

**Pasos del flujo:**

```
1. La ONG accede al módulo de distribución.
2. Selecciona el beneficiario o grupo de beneficiarios.
3. El sistema sugiere alimentos a distribuir según prioridad FEFO:
   - Alimentos más próximos a vencer primero.
4. La ONG ajusta cantidades según necesidad y política interna.
5. El sistema valida:
   - Stock suficiente para la cantidad seleccionada.
   - Alimento no vencido.
   - Beneficiario activo y habilitado.
6. La ONG confirma la distribución.
7. El sistema:
   a. Genera un Movimiento de inventario tipo "SALIDA".
   b. Reduce el stock del Lote afectado.
   c. Registra la asignación con referencia al beneficiario.
8. El beneficiario recibe notificación (si aplica) y confirma recepción.
9. El sistema registra la confirmación de recepción para trazabilidad.
```

---

## 3. Reglas de Negocio

### 3.1 Priorización por Fecha de Vencimiento

- **FEFO obligatorio:** El sistema siempre debe sugerir y priorizar los lotes con menor fecha de vencimiento para salidas de inventario.
- Un alimento con menos de **7 días** para vencer recibe prioridad máxima y genera alerta crítica.
- No se pueden distribuir alimentos en estado `VENCIDO`.
- Los umbrales de alerta (7, 30 días) son configurables por el Administrador, pero no pueden ser inferiores a 1 día.

---

### 3.2 Condiciones de Disponibilidad y Publicación

Para que un alimento sea **visible y distribuible**, debe cumplir:

- [ ] El Lote asociado tiene estado `ACTIVO`.
- [ ] La fecha de vencimiento es **mayor a la fecha actual**.
- [ ] El stock disponible del lote es **mayor a 0**.
- [ ] La ONG que lo custodia tiene estado `VERIFICADA`.
- [ ] El alimento pasó la inspección de recepción (no fue rechazado).

Si alguna condición falla, el alimento se marca como `NO DISPONIBLE` y no aparece en la lista de distribución.

---

### 3.3 Restricciones y Permisos por Rol

El sistema implementa control de acceso basado en roles (RBAC). Un usuario puede tener múltiples roles activos simultáneamente.

| Acción                              | Administrador | ONG | Donante | Beneficiario |
|-------------------------------------|:---:|:---:|:---:|:---:|
| Registrar donación                  | ✅  | ✅  | ✅  | ❌  |
| Aceptar/rechazar donación           | ✅  | ✅  | ❌  | ❌  |
| Registrar recepción en inventario   | ✅  | ✅  | ❌  | ❌  |
| Ver inventario propio de ONG        | ✅  | ✅  | ❌  | ❌  |
| Ver inventario de todas las ONG     | ✅  | ❌  | ❌  | ❌  |
| Distribuir alimentos                | ✅  | ✅  | ❌  | ❌  |
| Dar de baja alimentos               | ✅  | ✅  | ❌  | ❌  |
| Ajustar inventario (manual)         | ✅  | ❌  | ❌  | ❌  |
| Aprobar registro de ONG             | ✅  | ❌  | ❌  | ❌  |
| Gestionar roles de usuario          | ✅  | ❌  | ❌  | ❌  |
| Ver historial de donaciones propias | ✅  | ✅  | ✅  | ✅  |
| Confirmar recepción de alimentos    | ✅  | ✅  | ❌  | ✅  |
| Generar reportes globales           | ✅  | ❌  | ❌  | ❌  |
| Generar reportes de su ONG          | ✅  | ✅  | ❌  | ❌  |

---

### 3.4 Validaciones de Seguridad y Trazabilidad

**Seguridad:**
- Autenticación requerida para todas las operaciones.
- Tokens de sesión con expiración configurable.
- Las acciones sensibles (ajuste de inventario, baja de lotes) requieren doble confirmación.
- Los ajustes manuales de inventario solo los puede realizar el Administrador y quedan registrados con motivo obligatorio.

**Trazabilidad:**
- Cada movimiento de inventario registra: `usuario_id`, `fecha_hora`, `acción`, `entidad_afectada`, `cantidad_anterior`, `cantidad_nueva`, `motivo`.
- No se permite la eliminación física de registros históricos (soft delete únicamente).
- Las donaciones, lotes y movimientos son inmutables una vez confirmados; solo se pueden agregar registros de corrección.
- Todo cambio de estado de una donación queda registrado con `timestamp` y usuario responsable.

---

## 4. Entidades del Sistema

### 4.1 Alimento (`Food`)

Representa un tipo de alimento genérico del catálogo.

| Atributo         | Tipo       | Descripción                                      |
|------------------|------------|--------------------------------------------------|
| `id`             | UUID       | Identificador único                              |
| `nombre`         | String     | Nombre del alimento                              |
| `categoria`      | Enum       | Lácteos, Frutas, Verduras, Granos, Proteínas, etc.|
| `unidad_medida`  | Enum       | kg, litros, unidades, cajas                      |
| `requiere_frio`  | Boolean    | Indica si necesita refrigeración                 |
| `activo`         | Boolean    | Si está disponible en el catálogo                |

---

### 4.2 Lote (`Batch`)

Agrupa unidades del mismo alimento con la misma fecha de vencimiento y origen.

| Atributo              | Tipo       | Descripción                                           |
|-----------------------|------------|-------------------------------------------------------|
| `id`                  | UUID       | Identificador único                                   |
| `alimento_id`         | UUID FK    | Referencia al alimento                                |
| `donacion_id`         | UUID FK    | Donación de origen                                    |
| `ong_id`              | UUID FK    | ONG que custodia el lote                              |
| `numero_lote`         | String     | Número de lote del fabricante/productor               |
| `fecha_vencimiento`   | Date       | Fecha de vencimiento del lote                         |
| `cantidad_inicial`    | Decimal    | Cantidad recibida originalmente                       |
| `cantidad_disponible` | Decimal    | Stock actual disponible                               |
| `estado`              | Enum       | ACTIVO, AGOTADO, VENCIDO, BAJA                        |
| `nivel_alerta`        | Enum       | NORMAL, PROXIMO, CRITICO, VENCIDO                     |
| `fecha_ingreso`       | DateTime   | Cuándo ingresó al sistema                             |

---

### 4.3 Donación (`Donation`)

Registro formal de la intención y acto de donación.

| Atributo              | Tipo       | Descripción                                           |
|-----------------------|------------|-------------------------------------------------------|
| `id`                  | UUID       | Identificador único                                   |
| `donante_id`          | UUID FK    | Donante que realiza la donación                       |
| `ong_id`              | UUID FK    | ONG receptora                                         |
| `alimento_id`         | UUID FK    | Tipo de alimento donado                               |
| `cantidad`            | Decimal    | Cantidad declarada en la donación                     |
| `unidad_medida`       | Enum       | Coincide con el alimento                              |
| `fecha_vencimiento`   | Date       | Fecha de vencimiento declarada por el donante         |
| `numero_lote`         | String     | Lote declarado por el donante                         |
| `estado`              | Enum       | PENDIENTE, ACEPTADA, RECHAZADA, RECIBIDA, CANCELADA   |
| `fecha_creacion`      | DateTime   | Cuándo se registró                                    |
| `fecha_entrega`       | DateTime   | Cuándo se realizó la entrega física                   |
| `observaciones`       | Text       | Notas adicionales                                     |

---

### 4.4 ONG (`Organization`)

Entidad que gestiona la recepción y distribución de alimentos.

| Atributo               | Tipo       | Descripción                                          |
|------------------------|------------|------------------------------------------------------|
| `id`                   | UUID       | Identificador único                                  |
| `nombre`               | String     | Nombre legal de la organización                      |
| `nit`                  | String     | Número de identificación tributaria                  |
| `direccion`            | String     | Dirección física                                     |
| `ciudad`               | String     | Ciudad de operación                                  |
| `contacto_nombre`      | String     | Nombre del representante                             |
| `contacto_email`       | String     | Email de contacto                                    |
| `contacto_telefono`    | String     | Teléfono de contacto                                 |
| `capacidad_bodega`     | Decimal    | Capacidad máxima de almacenamiento (m³ o unidades)   |
| `estado`               | Enum       | PENDIENTE, VERIFICADA, SUSPENDIDA                    |
| `fecha_registro`       | DateTime   | Cuándo se registró                                   |

---

### 4.5 Usuario (`User`)

Persona que interactúa con el sistema. Un usuario puede tener múltiples roles.

| Atributo         | Tipo       | Descripción                                      |
|------------------|------------|--------------------------------------------------|
| `id`             | UUID       | Identificador único                              |
| `nombre`         | String     | Nombre completo                                  |
| `email`          | String     | Email (único, usado como login)                  |
| `password_hash`  | String     | Contraseña encriptada                            |
| `roles`          | Array Enum | [ADMINISTRADOR, ONG, DONANTE, BENEFICIARIO]      |
| `ong_id`         | UUID FK    | ONG asociada (si aplica)                         |
| `estado`         | Enum       | ACTIVO, INACTIVO, SUSPENDIDO                     |
| `fecha_registro` | DateTime   | Cuándo se creó la cuenta                         |

---

### 4.6 Movimiento de Inventario (`InventoryMovement`)

Registro inmutable de cada operación que modifica el stock.

| Atributo          | Tipo       | Descripción                                           |
|-------------------|------------|-------------------------------------------------------|
| `id`              | UUID       | Identificador único                                   |
| `lote_id`         | UUID FK    | Lote afectado                                         |
| `ong_id`          | UUID FK    | ONG que realiza el movimiento                         |
| `usuario_id`      | UUID FK    | Usuario responsable                                   |
| `tipo`            | Enum       | ENTRADA, SALIDA, BAJA, AJUSTE, TRANSFERENCIA          |
| `cantidad`        | Decimal    | Cantidad movida                                       |
| `stock_anterior`  | Decimal    | Stock antes del movimiento                            |
| `stock_nuevo`     | Decimal    | Stock después del movimiento                          |
| `motivo`          | Text       | Razón del movimiento (obligatorio en BAJA y AJUSTE)   |
| `referencia_id`   | UUID       | ID de donación o distribución relacionada             |
| `fecha_hora`      | DateTime   | Timestamp del movimiento                              |

---

## 5. Diagramas

### 5.1 Diagrama de Flujo de Procesos

#### Flujo Principal: De Donación a Distribución

```
┌─────────────┐
│   DONANTE   │
└──────┬──────┘
       │ Registra donación
       ▼
┌─────────────────────────────────────────────────┐
│              DONACIÓN CREADA                    │
│              Estado: PENDIENTE                  │
└──────────────────────┬──────────────────────────┘
                       │ Notificación a ONG
                       ▼
              ┌────────────────┐
              │  ONG revisa    │
              └───────┬────────┘
          ┌───────────┴────────────┐
          ▼                        ▼
   [Rechaza]                  [Acepta]
       │                          │
       ▼                          ▼
 Estado: RECHAZADA         Estado: ACEPTADA
       │                          │
       │ Donante puede            │ Coordinan entrega
       │ reasignar                ▼
       │                 ┌─────────────────┐
       │                 │ Entrega física  │
       │                 └────────┬────────┘
       │                          │
       │                 ┌────────▼────────────────┐
       │                 │   Inspección de ONG     │
       │                 └────────┬────────────────┘
       │                ┌─────────┴──────────┐
       │                ▼                    ▼
       │         [No apto]             [Apto]
       │              │                    │
       │              ▼                    ▼
       │    Rechazado en          Estado: RECIBIDA
       │    recepción             Crear/actualizar LOTE
       │                          Movimiento: ENTRADA
       │                                │
       │                         ┌──────▼──────────┐
       │                         │   INVENTARIO    │
       │                         │  Alerta FEFO    │
       │                         └──────┬──────────┘
       │                                │
       │                    ┌───────────▼───────────┐
       │                    │   ONG distribuye      │
       │                    │   a Beneficiarios     │
       │                    └───────────┬───────────┘
       │                                │
       │                    ┌───────────▼───────────┐
       │                    │  Movimiento: SALIDA   │
       │                    │  Stock actualizado    │
       │                    └───────────────────────┘
       │
       ▼
 [Fin del flujo alternativo]
```

#### Flujo de Alerta por Vencimiento

```
  Proceso diario batch
         │
         ▼
  Para cada Lote ACTIVO:
         │
         ├─ días_restantes > 30  → 🟢 NORMAL     → Sin acción
         │
         ├─ 8 ≤ días_restantes ≤ 30 → 🟡 PRÓXIMO → Notificar ONG
         │
         ├─ 1 ≤ días_restantes ≤ 7  → 🔴 CRÍTICO  → Alerta urgente
         │                                           Priorizar distribución
         │
         └─ días_restantes ≤ 0   → ⛔ VENCIDO  → Movimiento BAJA
                                                   Notificar ONG
                                                   Retirar del inventario
```

---

### 5.2 Diagrama de Casos de Uso

```
                        SISTEMA DE GESTIÓN ONG Y ALIMENTOS
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║  ┌─────────────┐    ──── Registrar donación                              ║
║  │             │   /                                                      ║
║  │   DONANTE   │──────── Ver historial de donaciones                     ║
║  │             │   \                                                      ║
║  └─────────────┘    ──── Cancelar donación                               ║
║                                                                          ║
║  ┌─────────────┐    ──── Aceptar / rechazar donación                     ║
║  │             │   /                                                      ║
║  │     ONG     │──────── Registrar recepción                             ║
║  │             │   |──── Gestionar inventario                            ║
║  │             │   |──── Distribuir alimentos                            ║
║  └─────────────┘    ──── Ver alertas de vencimiento                      ║
║                                                                          ║
║  ┌─────────────┐    ──── Ver asignaciones                                ║
║  │ BENEFICIARIO│   /                                                      ║
║  │             │──────── Confirmar recepción                             ║
║  └─────────────┘                                                         ║
║                                                                          ║
║  ┌─────────────┐    ──── Aprobar / suspender ONG                         ║
║  │             │   /                                                      ║
║  │ADMINISTRADOR│──────── Ajustar inventario                              ║
║  │             │   |──── Gestionar roles y usuarios                      ║
║  │             │   |──── Ver reportes globales                           ║
║  └─────────────┘    ──── Configurar reglas del sistema                   ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

### 5.3 Borrador del Modelo Entidad-Relación

```
┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
│    USER      │         │   ORGANIZATION   │         │    FOOD      │
│──────────────│         │  (ONG)           │         │──────────────│
│ id (PK)      │    ┌───▶│──────────────────│         │ id (PK)      │
│ nombre       │    │    │ id (PK)          │         │ nombre       │
│ email        │    │    │ nombre           │         │ categoria    │
│ password_hash│    │    │ nit              │         │ unidad_medida│
│ roles[]      │    │    │ direccion        │         │ requiere_frio│
│ ong_id (FK)  │────┘    │ capacidad_bodega │         │ activo       │
│ estado       │         │ estado           │         └──────┬───────┘
└──────────────┘         └────────┬─────────┘                │
                                  │                          │
        ┌─────────────────────────┼──────────────────────────┤
        │                         │                          │
        ▼                         ▼                          │
┌──────────────┐         ┌──────────────────┐               │
│   DONATION   │         │     BATCH        │◀──────────────┘
│──────────────│         │  (LOTE)          │
│ id (PK)      │────────▶│──────────────────│
│ donante_id   │    ┌───▶│ id (PK)          │
│ ong_id (FK)  │────┤    │ alimento_id (FK) │
│ alimento_id  │────┘    │ donacion_id (FK) │
│ cantidad     │         │ ong_id (FK)      │
│ fecha_venc   │         │ numero_lote      │
│ numero_lote  │         │ fecha_vencimiento│
│ estado       │         │ cantidad_inicial │
│ fecha_creac. │         │ cantidad_disp.   │
└──────────────┘         │ estado           │
                         │ nivel_alerta     │
                         └────────┬─────────┘
                                  │
                                  │ 1:N
                                  ▼
                         ┌──────────────────┐
                         │INVENTORY_MOVEMENT│
                         │──────────────────│
                         │ id (PK)          │
                         │ lote_id (FK)     │
                         │ ong_id (FK)      │
                         │ usuario_id (FK)  │
                         │ tipo             │
                         │ cantidad         │
                         │ stock_anterior   │
                         │ stock_nuevo      │
                         │ motivo           │
                         │ referencia_id    │
                         │ fecha_hora       │
                         └──────────────────┘

Leyenda de relaciones:
  ──────▶   FK (muchos a uno)
  ──────┤   un registro puede tener muchos hijos (1 a N)
```

**Relaciones clave:**

| Relación                                 | Cardinalidad |
|------------------------------------------|--------------|
| User → Organization                      | N:1          |
| Organization → Donation                  | 1:N          |
| Donation → Batch                         | 1:1 ó 1:N    |
| Batch → InventoryMovement                | 1:N          |
| Food → Batch                             | 1:N          |
| Food → Donation                          | 1:N          |
| User → InventoryMovement                 | 1:N          |

---

## 6. Glosario

| Término             | Definición                                                                                    |
|---------------------|-----------------------------------------------------------------------------------------------|
| **FEFO**            | First Expired, First Out. Política de salida que prioriza los productos con menor vida útil   |
| **Lote**            | Agrupación de unidades del mismo alimento con idéntica fecha de vencimiento y origen          |
| **Stock disponible**| Cantidad de alimento de un lote que puede distribuirse en un momento dado                     |
| **Soft delete**     | Eliminación lógica de un registro (marcarlo como inactivo sin borrar de la base de datos)     |
| **Multi-rol**       | Capacidad de un usuario para tener y ejercer más de un rol en el sistema simultáneamente      |
| **Umbral**          | Valor límite configurable que dispara una alerta o acción automática en el sistema            |
| **RBAC**            | Role-Based Access Control. Control de acceso basado en roles                                  |
| **Trazabilidad**    | Capacidad del sistema de registrar y consultar el historial completo de cada operación        |
| **Baja**            | Operación de retiro definitivo de un alimento del inventario (por vencimiento o deterioro)    |
| **ONG verificada**  | Organización cuyo registro fue revisado y aprobado por un Administrador del sistema           |

---

> **Notas de versión:**
> - v1.0.0 (2025-04-01): Documento inicial. Cubre actores, flujos, reglas de negocio, entidades y diagramas para el MVP.
> - v1.1.0 (2026-04-05): Se agrega sección 7 con diagnóstico del estado actual del desarrollo.

---

## 7. Diagnóstico del Estado Actual del Desarrollo

Esta sección contrasta la lógica de negocio documentada en las secciones anteriores con el estado real del desarrollo del sistema a la fecha de este análisis.

---

### 7.1 Arquitectura Técnica Implementada

| Capa              | Tecnología / Patrón actual                                                                 |
|-------------------|--------------------------------------------------------------------------------------------|
| **Frontend**      | Aplicación web basada en componentes con `Context API` para manejo de estado global (sesiones de usuario) |
| **Backend**       | Supabase como Backend-as-a-Service (BaaS): gestiona autenticación, base de datos y storage |
| **Base de datos** | PostgreSQL administrado por Supabase; estructura actual de tipo CRUD básico                |
| **Autenticación** | Sistema de sesiones gestionado por Supabase Auth con diferenciación de perfiles por rol    |

---

### 7.2 Módulos Actualmente Implementados

| # | Módulo                      | Estado        | Descripción de lo implementado                                                                 |
|---|-----------------------------|:-------------:|-----------------------------------------------------------------------------------------------|
| 1 | **Autenticación**           | ✅ Funcional  | Registro e inicio de sesión con diferenciación básica de perfiles (Tienda, ONG, Consumidor)   |
| 2 | **Dashboard**               | ✅ Funcional  | Panel principal con listado de productos próximos a vencer, filtros por categoría y acciones rápidas ("Donar", "Descuento") |
| 3 | **Listado de ubicaciones**  | ✅ Funcional  | Visualización básica de ONGs registradas y puntos de recolección en formato lista             |
| 4 | **Notificaciones**          | ✅ Parcial    | Alertas básicas en el frontend sobre productos próximos a caducar; no hay proceso batch automatizado |

---

### 7.3 Brechas frente a la Lógica de Negocio Documentada

Al comparar el código actual con la lógica de negocio definida en este documento, se identifican las siguientes inconsistencias y componentes faltantes:

#### Base de datos
- **No existen las tablas `Batch` (Lote) ni `InventoryMovement`** en Supabase. El sistema actual maneja los productos con un CRUD simple (una sola tabla), sin trazabilidad de movimientos ni agrupación por lotes.
- **Falta aplicar Row Level Security (RLS)** por rol en Supabase. Actualmente cualquier usuario autenticado podría acceder a datos que no le corresponden según la tabla de permisos de la sección 3.3.

#### Flujos de negocio
- **El flujo de donación está incompleto:** el botón "Donar" del dashboard existe en la UI, pero el ciclo de estados (`PENDIENTE` → `ACEPTADA` → `RECIBIDA`) y la notificación a la ONG no están codificados.
- **No existe el flujo de recepción e inspección (sección 2.2):** la ONG no tiene actualmente ningún módulo para aceptar, rechazar o registrar la inspección física de un alimento.
- **No existe el flujo de distribución a beneficiarios (sección 2.5):** no hay módulo de asignación ni registro de movimientos tipo `SALIDA`.

#### Reglas de negocio
- **FEFO no está implementado:** el dashboard muestra productos pero no los ordena ni prioriza por fecha de vencimiento en la lógica de distribución.
- **El proceso batch de alertas (sección 2.4) no existe:** los niveles de alerta (🟢 Normal, 🟡 Próximo, 🔴 Crítico, ⛔ Vencido) no se recalculan automáticamente de forma diaria.
- **No hay control de stock negativo:** el sistema actual no valida si hay suficiente stock antes de registrar una salida.

#### Seguridad
- **Tokens de sesión:** la expiración de sesión está delegada completamente a Supabase Auth con configuración por defecto; no se ha ajustado según los requerimientos del sistema.
- **Las acciones sensibles no requieren doble confirmación** (ej. dar de baja un lote, ajustar inventario manualmente).

---

### 7.4 Resumen para el Equipo

> El sistema cuenta con una base sólida de autenticación y una interfaz de usuario funcional (Dashboard + Listado de ONGs). Sin embargo, la base de datos actual no refleja el modelo entidad-relación definido en la sección 4 de este documento: faltan las tablas de `Lote` y `Movimiento de Inventario`, que son el núcleo de toda la trazabilidad del sistema. Antes de desarrollar cualquier nueva funcionalidad, es prioritario:
>
> 1. Ajustar el esquema de base de datos en Supabase para incluir las entidades del MER (sección 4).
> 2. Configurar las políticas RLS por rol (sección 3.3).
> 3. Implementar el flujo de donación completo con sus cambios de estado (sección 2.1).
>
> Sin estas correcciones, las nuevas funcionalidades (integraciones externas, certificados de donación, sistema de reputación) no tendrán una base de datos estable sobre la cual operar.
