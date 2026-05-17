# Plan de Contenerización — EcoSave Market

**Fecha:** 16 de mayo de 2026  
**Objetivo:** Empaquetar el frontend y el backend en contenedores Docker para facilitar el despliegue y la presentación del proyecto.

---

## Contexto del proyecto

| Servicio | Tecnología | Puerto | ¿Se conteneriza? |
|---------|-----------|--------|-----------------|
| Backend | AdonisJS 6 + Node.js | 3333 | ✅ Sí |
| Frontend | React + Vite → Nginx | 80 | ✅ Sí |
| Base de datos | Supabase (cloud externo) | — | ❌ No (ya está en la nube) |
| Email | Gmail SMTP (externo) | — | ❌ No |

La base de datos es Supabase, un servicio externo. No necesitamos un contenedor de base de datos; solo hay que pasar las variables de entorno correctas al backend.

---

## Archivos que se van a crear

```
EcoSave-Market-TIC-1/
├── docker-compose.yml              ← orquesta los dos servicios
├── backend-app/
│   ├── Dockerfile                  ← build + runtime del backend
│   └── .dockerignore               ← excluye node_modules, .env, etc.
└── frontend-app/
    ├── Dockerfile                  ← build Vite + servidor Nginx
    ├── nginx.conf                  ← configuración de Nginx para SPA
    └── .dockerignore               ← excluye node_modules, dist, etc.
```

Total: **5 archivos nuevos** (más el `docker-compose.yml` en la raíz).

---

## Paso 1 — Dockerfile del backend

**Estrategia:** Multi-stage build.  
- Etapa `builder`: instala todas las dependencias (incluyendo dev) y compila TypeScript con `node ace build`.  
- Etapa `runner`: imagen limpia, copia solo la carpeta `build/` y las dependencias de producción. Esto reduce el tamaño final del contenedor.

**Comandos clave del `package.json`:**
- Build: `node ace build` → genera la carpeta `build/`
- Start: `node bin/server.js` (dentro de `build/`)

**Variables de entorno necesarias en tiempo de ejecución:**
```
SUPABASE_URL
SUPABASE_KEY
PORT=3333
HOST=0.0.0.0
NODE_ENV=production
APP_KEY
EMAIL_HOST
EMAIL_PORT
EMAIL_USER
EMAIL_PASSWORD
FRONTEND_URL
```

---

## Paso 2 — Dockerfile del frontend

**Estrategia:** Multi-stage build.  
- Etapa `builder`: instala dependencias y ejecuta `tsc -b && vite build` → genera la carpeta `dist/`.  
- Etapa `server`: imagen Nginx Alpine (muy liviana), copia la carpeta `dist/` y sirve los archivos estáticos.

**Consideración crítica — variables de entorno en Vite:**  
Vite **bake** las variables `VITE_*` en el bundle durante el build, no en tiempo de ejecución. Eso significa que `VITE_API_URL` debe conocerse al momento de construir la imagen, no cuando se arranca el contenedor.

En `docker-compose.yml` se pasará como `build arg`:
```yaml
build:
  args:
    VITE_API_URL: http://localhost:3333/api/v1
```

Para producción real, este valor cambiaría a la URL pública del backend.

---

## Paso 3 — nginx.conf

Nginx necesita una configuración especial para que React Router funcione correctamente. Sin esto, al refrescar la página en cualquier ruta (ej. `/dashboard`) Nginx devolvería 404 porque no existe ese archivo en disco.

La regla clave:
```nginx
try_files $uri $uri/ /index.html;
```

Esto redirige cualquier ruta no encontrada al `index.html`, dejando que React Router tome el control.

---

## Paso 4 — docker-compose.yml

Orquesta los dos servicios con una red interna compartida.

**Estructura:**
```
services:
  backend:
    build: ./backend-app
    ports: "3333:3333"
    env_file: ./backend-app/.env
    
  frontend:
    build: ./frontend-app (con VITE_API_URL como build arg)
    ports: "80:80"
    depends_on: backend
```

Con `depends_on`, Docker arranca el backend antes que el frontend.

---

## Paso 5 — Archivos .dockerignore

Excluyen archivos que no deben entrar al contenedor:

**Backend:**
```
node_modules/
.env
tmp/
build/
*.log
```

**Frontend:**
```
node_modules/
.env
dist/
*.log
```

Sin `.dockerignore`, Docker copiaría la carpeta `node_modules/` (que puede pesar más de 200 MB) dentro del contexto de build, haciéndolo muy lento.

---

## Paso 6 — Ajuste de CORS (necesario para Docker)

Actualmente `config/cors.ts` tiene `origin: true` (acepta cualquier origen). Para producción en Docker es mejor restringirlo. Se actualizará para leer `FRONTEND_URL` desde las variables de entorno:

```ts
origin: [env.get('FRONTEND_URL', 'http://localhost')]
```

Este cambio es pequeño pero importante para no tener CORS abierto en producción.

---

## Flujo de ejecución completo

```
# 1. Tener el archivo backend-app/.env con las credenciales reales

# 2. Construir y levantar ambos contenedores
docker compose up --build

# 3. La app queda disponible en:
#    Frontend → http://localhost
#    Backend  → http://localhost:3333
```

Para detener:
```
docker compose down
```

---

## Consideraciones antes de implementar

| Punto | Estado | Acción |
|-------|--------|--------|
| `backend-app/.env` con credenciales reales | Requerido | Debe existir antes de `docker compose up` |
| `VITE_API_URL` en docker-compose | Requerido | Apuntar a `http://localhost:3333/api/v1` para demo local |
| Node.js version | Usar Node 20 LTS | AdonisJS 6 requiere Node ≥ 20 |
| `.env` en `.gitignore` | Verificar | El `.env` real no debe subir al repo |

---

## Resultado esperado

Al terminar esta implementación:

1. Con un solo comando (`docker compose up --build`) se levanta toda la aplicación.
2. No se necesita instalar Node.js, npm, ni ninguna dependencia en la máquina del evaluador.
3. El frontend queda en `http://localhost` y el backend en `http://localhost:3333`.
4. La app funciona idéntico a como funciona en desarrollo local.

---

*Plan redactado el 16 de mayo de 2026*
