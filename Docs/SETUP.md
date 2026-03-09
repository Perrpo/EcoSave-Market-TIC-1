# 🚀 Guía Rápida de Configuración

## Pasos para iniciar el proyecto

### 1. Configurar Backend

```bash
# Navegar al backend
cd backend-app

# Instalar dependencias (si no lo has hecho)
npm install

# Verificar que el archivo .env existe con las credenciales de Supabase
# Si no existe, créalo con el contenido del README.md

# Iniciar el servidor backend
npm run dev
```

✅ El backend debería estar corriendo en: **http://localhost:3333**

### 2. Configurar Frontend

```bash
# Abrir una nueva terminal
# Navegar al frontend
cd frontend-app

# Instalar dependencias (si no lo has hecho)
npm install

# Iniciar el servidor frontend
npm run dev
```

✅ El frontend debería estar corriendo en: **http://localhost:5173**

### 3. Probar la Aplicación

1. Abre tu navegador en: **http://localhost:5173**
2. Verás la pantalla de autenticación
3. Puedes:
   - **Registrarte** con un nuevo usuario
   - **Iniciar sesión** (después de registrarte)

### 4. Verificar Conexión a Supabase

Visita estos endpoints para verificar:
- http://localhost:3333/api/v1/supabase/info
- http://localhost:3333/api/v1/supabase/test

## 🎯 Funcionalidades Disponibles

Una vez autenticado, tendrás acceso a:

### Dashboard (`/dashboard`)
- Lista de productos próximos a vencer
- Estadísticas de inventario
- Acciones de donación y descuento

### Mapa (`/map`)
- Ubicaciones de ONGs
- Puntos de recolección
- Información de contacto

### Notificaciones (`/notifications`)
- Alertas de vencimiento
- Configuración de notificaciones
- Historial de actividades

## 🔧 Solución de Problemas

### El backend no inicia
- Verifica que el archivo `.env` existe en `backend-app/`
- Asegúrate de haber ejecutado `node ace generate:key`
- Revisa que el puerto 3333 no esté en uso

### El frontend no inicia
- Verifica que instalaste las dependencias: `npm install`
- Revisa que el puerto 5173 no esté en uso
- Limpia el caché: `rm -rf node_modules && npm install`

### Error de conexión a Supabase
- Verifica las credenciales en el archivo `.env`
- Asegúrate de que la URL y la KEY son correctas
- Prueba el endpoint: http://localhost:3333/api/v1/supabase/test

### Error de autenticación
- El backend debe estar corriendo en el puerto 3333
- Verifica la consola del navegador para ver errores
- Asegúrate de que las rutas de API son correctas

## 📦 Comandos Útiles

### Backend
```bash
# Desarrollo
npm run dev

# Build
npm run build

# Linting
npm run lint

# Tests
npm run test
```

### Frontend
```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Linting
npm run lint
```

## 🎨 Personalización

### Cambiar colores del tema
Edita `frontend-app/src/index.css` y modifica las variables CSS:
- `--neon-cyan`
- `--neon-magenta`
- `--neon-purple`

### Cambiar puerto del backend
Edita `backend-app/.env` y cambia `PORT=3333`

### Cambiar puerto del frontend
Edita `frontend-app/vite.config.ts` y agrega:
```ts
export default defineConfig({
  server: {
    port: 5173
  }
})
```

## ✨ ¡Listo!

Tu aplicación EcoSave Market debería estar funcionando correctamente.

Para cualquier duda, revisa:
- README.md principal
- Documentación de AdonisJS: https://adonisjs.com
- Documentación de React: https://react.dev
- Documentación de Supabase: https://supabase.com/docs
