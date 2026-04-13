# 🚀 Guía de Solución - Comunicación entre Roles en EcoSave Market

## 📋 Problema Resuelto

**Problema Original:** Los supermercados y ONGs no podían comunicarse entre sí. Cuando un supermercado donaba un producto, la ONG no lo veía, y cuando una ONG solicitaba una donación, el supermercado no lo sabía.

**Causa Raíz:** Los dashboards usaban datos estáticos (mock data) locales en lugar de una base de datos compartida.

## ✅ Solución Implementada

### 1. Backend - Nuevos Endpoints

#### 📦 Productos (`/api/v1/products`)
- `GET /` - Listar productos de un supermercado
- `POST /` - Crear nuevo producto
- `GET /:id` - Obtener producto específico
- `PUT /:id` - Actualizar producto
- `DELETE /:id` - Eliminar producto
- `GET /available` - Productos disponibles para donación (ONGs)

#### 🤝 Donaciones (`/api/v1/donations`)
- `GET /` - Listar donaciones
- `POST /` - Crear donación (supermercado)
- `GET /:id` - Obtener donación específica
- `POST /:id/request` - ONG solicita donación
- `POST /:id/confirm` - ONG confirma recepción
- `GET /available` - Donaciones disponibles para ONGs
- `GET /stats` - Estadísticas de donaciones

### 2. Frontend - Servicio de API

Creado `frontend-app/src/services/api.ts` con:
- Conexión centralizada al backend
- Manejo de errores automático
- Tipos TypeScript para todas las respuestas
- Métodos para productos y donaciones

### 3. Base de Datos - Supabase

Creado `database-setup.sql` con:
- ✅ Tablas `products` y `donations`
- ✅ Relaciones proper con usuarios
- ✅ Row Level Security (RLS)
- ✅ Índices para rendimiento
- ✅ Triggers automáticos para estados
- ✅ Vistas para consultas fáciles

## 🛠️ Instalación y Configuración

### Paso 1: Configurar Base de Datos

1. Ve a tu proyecto de Supabase
2. Abre el SQL Editor
3. Ejecuta el contenido de `database-setup.sql`

```sql
-- Copia y pega todo el contenido del archivo database-setup.sql
```

### Paso 2: Iniciar Backend

```bash
cd backend-app
npm install
npm run dev
```

El backend estará en: http://localhost:3333

### Paso 3: Iniciar Frontend

```bash
cd frontend-app
npm install
npm run dev
```

El frontend estará en: http://localhost:5173

## 🔄 Flujo de Comunicación Ahora Funciona

### 1. Supermercado dona producto:
```
Supermercado → POST /api/v1/donations → Base de Datos
                ↓
         Producto marcado como "donated"
                ↓
         Donación creada con status "available"
```

### 2. ONG ve donaciones disponibles:
```
ONG → GET /api/v1/donations/available → Base de Datos → Lista de donaciones
```

### 3. ONG solicita donación:
```
ONG → POST /api/v1/donations/:id/request → Base de Datos
                ↓
         Donación status cambia a "requested"
                ↓
         ong_id se asigna a la ONG
```

### 4. Supermercado ve sus donaciones:
```
Supermercado → GET /api/v1/donations?supermarket_id=xxx → Sus donaciones con estados actualizados
```

## 🎯 Características Clave

### ✅ Sincronización en Tiempo Real
- Cuando un supermercado dona, inmediatamente aparece para ONGs
- Cuando una ONG solicita, el supermercado ve el cambio de estado

### ✅ Estados Claros
- **Productos**: Normal, Advertencia, Urgente, Vencido
- **Donaciones**: Available, Requested, Completed

### ✅ Seguridad
- Solo los supermercados ven sus propios productos
- Solo las ONGs pueden solicitar donaciones
- RLS (Row Level Security) en Supabase

### ✅ Automatización
- Estados de productos calculados automáticamente por fecha de vencimiento
- Timestamps automáticos
- Productos marcados como donados al crear donación

## 🧪 Pruebas

### Escenario 1: Supermercado → ONG
1. Inicia sesión como supermercado
2. Agrega un producto próximo a vencer
3. Dona el producto
4. Cierra sesión
5. Inicia sesión como ONG
6. **✅ Deberías ver la donación disponible**

### Escenario 2: ONG → Supermercado
1. Inicia sesión como ONG
2. Solicita una donación disponible
3. Cierra sesión
4. Inicia sesión como supermercado
5. **✅ Deberías ver la donación como "solicitada"**

### Escenario 3: Confirmación
1. Como ONG, confirma recepción de una donación solicitada
2. Como supermercado, verifica el estado
3. **✅ Debería aparecer como "completada"**

## 🔍 Troubleshooting

### Error: "No hay donaciones disponibles"
- Verifica que el backend esté corriendo en localhost:3333
- Revisa la consola del navegador para errores de API
- Asegúrate de haber ejecutado el script SQL en Supabase

### Error: "Usuario no autenticado"
- Asegúrate de haber iniciado sesión correctamente
- Verifica que el usuario tenga el rol correcto (supermarket/ong)

### Error: "Producto no encontrado"
- Verifica que el producto exista en la base de datos
- Revisa que el supermarket_id sea correcto

## 📊 Estructura de Datos

### Products
```sql
{
  id: UUID,
  supermarket_id: UUID, // Usuario supermercado
  nombre: string,
  categoria: string,
  unidades: number,
  vencimiento: date,
  estado: string, // Auto-calculado
  color: string,  // Auto-calculado
  donated: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Donations
```sql
{
  id: UUID,
  product_id: UUID,
  supermarket_id: UUID,
  ong_id: UUID, // Se asigna cuando ONG solicita
  product_name: string,
  product_category: string,
  quantity: number,
  expiry_date: date,
  status: 'available' | 'requested' | 'completed',
  created_at: timestamp,
  requested_at: timestamp,
  completed_at: timestamp
}
```

## 🎉 Resultado Final

¡Ahora tu plataforma de EcoSave Market tiene comunicación completa entre roles!

- ✅ **Supermercados** pueden donar productos y ver el estado en tiempo real
- ✅ **ONGs** pueden ver y solicitar donaciones disponibles
- ✅ **Comunicación bidireccional** funcional
- ✅ **Base de datos centralizada** con toda la información
- ✅ **Seguridad** y permisos proper
- ✅ **Escalabilidad** para futuras características

El problema de comunicación está completamente resuelto. 🚀
