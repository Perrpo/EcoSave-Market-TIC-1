# Investigación Ley 2380/2024 y Diseño de Plantilla de Certificado de Donación

## 1. Objetivo

Diseñar la estructura funcional y visual del certificado de donación requerido por el sistema, tomando como referencia la Ley 2380 de 2024 de Colombia, con el fin de garantizar validez legal y soporte para beneficios tributarios asociados a la donación de alimentos y bienes de higiene y aseo.

---

# 2. Análisis de la Ley 2380 de 2024

La Ley 2380 de 2024 promueve la donación de alimentos aptos para el consumo humano y bienes de higiene y aseo a bancos de alimentos registrados bajo el Régimen Tributario Especial.

La normativa establece beneficios tributarios para los donantes y exige soporte documental que permita certificar:

- La existencia de la donación.
- El valor donado.
- Los costos asociados al transporte.
- La identificación del donante y del donatario.

Además, el certificado debe permitir trazabilidad y verificación de autenticidad.

---

# 3. Campos Obligatorios del Certificado

## Información del Donante

- Nombre o razón social
- Tipo de documento
- Número de identificación (NIT o cédula)
- Dirección
- Teléfono
- Correo electrónico

## Información del Donatario

- Nombre de la entidad receptora
- NIT
- Dirección
- Representante legal

## Información de la Donación

- Código único del certificado
- Fecha de emisión
- Fecha de recepción de la donación
- Tipo de donación:
  - Alimentos
  - Bienes de higiene
  - Bienes de aseo
- Descripción de los productos
- Cantidad
- Valor estimado
- Costos de transporte
- Valor total certificado

## Validación

- Firma digital o firma autorizada
- Estado del certificado
- Código QR de verificación

---

# 4. Diseño del Layout del Certificado

## Encabezado

- Logo de la organización
- Nombre del sistema
- Título:
  "Certificado de Donación"
- Número único del certificado

## Cuerpo Principal

### Sección 1 – Datos del Donante

Bloque con la información general del donante.

### Sección 2 – Datos de la Donación

Tabla con:

| Producto | Cantidad | Tipo | Valor |
|---|---|---|---|

Además:

- Valor transporte
- Valor total

### Sección 3 – Información Legal

Texto indicando que el certificado se genera bajo lineamientos de la Ley 2380 de 2024.

## Pie de Página

- Firma autorizada
- Fecha de emisión
- Código QR
- URL de verificación

---

# 5. Modelo de Datos Propuesto

## Entidad: CertificadoDonacion

| Campo | Tipo |
|---|---|
| id | UUID |
| codigo_certificado | String |
| fecha_emision | Date |
| fecha_recepcion | Date |
| donante_id | UUID |
| donatario_id | UUID |
| valor_total | Decimal |
| valor_transporte | Decimal |
| qr_hash | String |
| estado | Enum |

---

## Entidad: DonacionDetalle

| Campo | Tipo |
|---|---|
| id | UUID |
| certificado_id | UUID |
| producto | String |
| categoria | String |
| cantidad | Integer |
| valor | Decimal |

---

# 6. Propuesta de Código QR

El QR permitirá validar autenticidad del certificado.

## Contenido propuesto

```json
{
  "certificado": "CERT-2026-001",
  "fecha": "2026-05-06",
  "donante": "900123456",
  "valor_total": 1500000,
  "hash": "a8f3c29b..."
}
