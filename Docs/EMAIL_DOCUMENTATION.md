# 📧 Sistema de Emails - EcoSave Market

## Descripción

Sistema automatizado de notificaciones por email para confirmación de donaciones de alimentos próximos a vencer.

## Características

✅ **Email de confirmación de donación** con comprobante PDF adjunto  
✅ **Notificaciones de cambio de estado** de las donaciones  
✅ **Email de prueba** para verificar configuración  
✅ **Diseño responsive** con tema EcoSave Market  
✅ **Codificación UTF-8** para caracteres especiales  

---

## 📋 Configuración Inicial

### 1. Variables de Entorno

Asegúrate de tener estas variables en tu archivo `.env`:

```env
# Configuración SMTP (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicacion
```

### 2. Obtener Contraseña de Aplicación de Gmail

1. Ve a tu cuenta de Google: https://myaccount.google.com/security
2. Activa la **verificación en 2 pasos**
3. Ve a: https://myaccount.google.com/apppasswords
4. Genera una contraseña de aplicación para "Correo"
5. Copia la contraseña generada (formato: `xxxx xxxx xxxx xxxx`)
6. Pégala en `EMAIL_PASSWORD` en tu archivo `.env`

### 3. Crear Tablas en Supabase

Ejecuta el script SQL en tu panel de Supabase (SQL Editor):

```sql
-- Tabla de órdenes/donaciones
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  products JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  shipping_address TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de logs de emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent'
);

-- Políticas de acceso
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on orders"
  ON public.orders FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on email_logs"
  ON public.email_logs FOR ALL USING (true) WITH CHECK (true);
```

---

## 🚀 Uso del Sistema

### Endpoints Disponibles

#### 1. Email de Prueba
Verifica que el servicio de email esté funcionando correctamente.

**Endpoint:** `POST /api/v1/orders/test-email`

**Body:**
```json
{
  "email": "tu-email@gmail.com"
}
```

**Ejemplo PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:3333/api/v1/orders/test-email" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"tu-email@gmail.com"}'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Email de prueba enviado a tu-email@gmail.com"
}
```

---

#### 2. Crear Donación
Crea una nueva donación en el sistema.

**Endpoint:** `POST /api/v1/orders`

**Body:**
```json
{
  "customer_name": "Juan Pérez",
  "customer_email": "juan@example.com",
  "customer_phone": "555-1234",
  "products": [
    {
      "product_id": "prod-001",
      "product_name": "Manzanas Orgánicas",
      "quantity": 3
    },
    {
      "product_id": "prod-002",
      "product_name": "Pan Integral",
      "quantity": 2
    }
  ],
  "total": 0,
  "payment_method": "donation",
  "shipping_address": "Calle Principal 123, Ciudad"
}
```

**Ejemplo PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:3333/api/v1/orders" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{
    "customer_name": "Juan Pérez",
    "customer_email": "juan@example.com",
    "customer_phone": "555-1234",
    "products": [
      {
        "product_id": "prod-001",
        "product_name": "Manzanas Orgánicas",
        "quantity": 3
      }
    ],
    "total": 0,
    "payment_method": "donation",
    "shipping_address": "Calle Principal 123"
  }'
```

---

#### 3. Enviar Email de Confirmación
Envía (o reenvía) el email de confirmación de donación con comprobante PDF.

**Endpoint:** `POST /api/v1/orders/:id/resend-email`

**Ejemplo PowerShell:**
```powershell
# Obtener el ID de la última donación y enviar email
$response = Invoke-RestMethod -Uri "http://127.0.0.1:3333/api/v1/orders?limit=1" -Method GET
$orderId = $response.data[0].id
Invoke-RestMethod -Uri "http://127.0.0.1:3333/api/v1/orders/$orderId/resend-email" `
  -Method POST `
  -ContentType "application/json"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Email reenviado exitosamente"
}
```

---

## 📨 Contenido del Email

### Asunto
```
🌱 ¡Gracias por tu Donación! #ABC12345 - EcoSave Market
```

### Contenido
- **Título:** "💚 ¡Gracias por tu Donación!"
- **Subtítulo:** "Has ayudado a rescatar alimentos próximos a vencer"
- **Información de la donación:**
  - Número de donación
  - Nombre del donante
  - Email
  - Fecha
  - Punto de recolección
- **Tabla de alimentos rescatados:**
  - Nombre del alimento
  - Cantidad
- **Mensaje de impacto:**
  - "Tu donación hace la diferencia"
  - "Estos alimentos serán distribuidos a quienes más lo necesitan"
  - "Juntos construimos un futuro más sostenible y solidario"
- **Botón:** "Ver mi Dashboard"

### Archivo Adjunto
- **Nombre:** `comprobante-donacion-ABC12345.pdf`
- **Tipo:** PDF con detalles de la donación

---

## 🔧 Solución de Problemas

### El email no se envía

1. **Verifica las credenciales:**
   ```bash
   # Revisa tu archivo .env
   cat backend-app/.env
   ```

2. **Verifica la conexión SMTP:**
   - Asegúrate de que Gmail permite "Aplicaciones menos seguras" o usa contraseña de aplicación
   - Verifica que el puerto 587 no esté bloqueado

3. **Revisa los logs del servidor:**
   - Busca mensajes de error en la consola donde corre `npm run dev`

### Caracteres especiales no se muestran correctamente

- El sistema usa UTF-8 por defecto
- Asegúrate de que los datos en la base de datos estén codificados en UTF-8
- Si el problema persiste, crea una nueva donación con datos frescos

### El PDF no se adjunta

- Verifica que el servicio `invoice_generator_service` esté funcionando
- Revisa que PDFKit esté instalado: `npm list pdfkit`

---

## 📊 Monitoreo

### Ver logs de emails enviados

```sql
-- En Supabase SQL Editor
SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 10;
```

### Ver donaciones recientes

```sql
-- En Supabase SQL Editor
SELECT id, customer_name, customer_email, status, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🎨 Personalización

### Cambiar el diseño del email

Edita el archivo: `backend-app/app/services/email_service.ts`

Busca el método `generateOrderConfirmationHTML()` y modifica:
- Colores en los estilos CSS
- Textos y mensajes
- Estructura HTML

### Cambiar el remitente

Modifica en `.env`:
```env
EMAIL_USER=nuevo-email@gmail.com
```

---

## 📝 Notas Importantes

- ✅ Los emails se envían de forma **asíncrona**
- ✅ Se registran todos los envíos en la tabla `email_logs`
- ✅ El sistema verifica la conexión SMTP al iniciar
- ✅ Compatible con Gmail, Outlook, Yahoo y otros servicios SMTP
- ⚠️ Para producción, considera usar servicios como SendGrid o Resend
- ⚠️ No uses tu contraseña personal de Gmail, siempre usa contraseña de aplicación

---

## 🔗 Recursos Adicionales

- [Documentación de Nodemailer](https://nodemailer.com/)
- [Contraseñas de aplicación de Google](https://support.google.com/accounts/answer/185833)
- [Documentación de PDFKit](https://pdfkit.org/)

---

## 👨‍💻 Soporte

Para problemas o preguntas sobre el sistema de emails:
1. Revisa esta documentación
2. Verifica los logs del servidor
3. Prueba con el endpoint `/test-email` primero
