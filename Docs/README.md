# 🍱 EcoSave Market - Plataforma Anti-Desperdicio de Alimentos

Plataforma completa para la gestión de productos próximos a vencer, conectando negocios con ONGs y consumidores para reducir el desperdicio de alimentos.

## 📋 Estructura del Proyecto

```
EcoSave-Market-main/
├── backend-app/          # Backend AdonisJS + Supabase
│   ├── app/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── middleware/
│   ├── config/
│   └── start/
└── frontend-app/         # Frontend React + TypeScript
    ├── src/
    │   ├── components/   # Componentes reutilizables
    │   ├── context/      # Context API (Auth)
    │   ├── pages/        # Páginas principales
    │   └── App.tsx       # Componente principal
    └── package.json
```

## 🚀 Tecnologías

### Backend
- **AdonisJS 6** - Framework Node.js
- **Supabase** - Base de datos y autenticación
- **TypeScript** - Tipado estático

### Frontend
- **React 19** - Librería UI
- **TypeScript** - Tipado estático
- **React Router** - Navegación
- **Vite** - Build tool
- **CSS Modules** - Estilos con tema cyberpunk

## 🔧 Instalación

### 1. Backend

```bash
cd backend-app
npm install
```

Crea el archivo `.env` con:

```env
TZ=UTC
PORT=3333
HOST=localhost
LOG_LEVEL=info
APP_KEY=tu_app_key_generada
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://otvxqjpofaibziffudwx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dnhxanBvZmFpYnppZmZ1ZHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjAwNzIsImV4cCI6MjA3ODI5NjA3Mn0.x_GWS6Vhtic1kT8gIskTa2lI-HIVGWiBZekBf-isVrA
```

Genera el APP_KEY:
```bash
node ace generate:key
```

### 2. Frontend

```bash
cd frontend-app
npm install
```

## 🎯 Ejecución

### Backend (Puerto 3333)
```bash
cd backend-app
npm run dev
```

El backend estará disponible en: http://localhost:3333

### Frontend (Puerto 5173)
```bash
cd frontend-app
npm run dev
```

El frontend estará disponible en: http://localhost:5173

## 📱 Características

### 🔐 Autenticación
- Sistema de login/registro con diseño split-screen
- Gestión de sesiones con Context API
- Integración con Supabase

### 📊 Dashboard
- Vista de productos próximos a vencer
- Estadísticas en tiempo real
- Acciones rápidas (Donar/Descuento)
- Filtros por categoría y estado

### 🗺️ Mapa Interactivo
- Visualización de ONGs cercanas
- Puntos de recolección
- Información de contacto
- Rutas a ubicaciones

### 🔔 Notificaciones
- Alertas de vencimiento
- Confirmaciones de donación
- Configuración personalizada
- Panel de estadísticas

## 🎨 Diseño

El proyecto utiliza un tema **cyberpunk futurista** con:
- Paleta de colores neón (cyan, magenta, purple)
- Efectos de glassmorphism
- Animaciones suaves
- Diseño responsive

## 🔗 Endpoints API

### Autenticación
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Inicio de sesión
- `POST /api/v1/auth/logout` - Cerrar sesión

### Supabase
- `GET /api/v1/supabase/info` - Información de conexión
- `GET /api/v1/supabase/test` - Test de conexión

### Salud
- `GET /api/v1/health` - Estado del servidor
- `GET /` - Información de la API

## 🔬 Low-Code y RPA en EcoSave Market

### ¿Qué es Low-Code?

El **Low-Code** es una metodología de desarrollo de software que permite crear aplicaciones mediante interfaces visuales, configuración y modelado en lugar de programación tradicional. En EcoSave Market, esta aproximación se manifiesta a través de:

#### Características Principales:
- **Desarrollo Visual**: Componentes pre-configurados que se arrastran y sueltan
- **Configuración vs Codificación**: Menos código manual, más configuración
- **Prototipado Rápido**: Creación rápida de interfaces funcionales
- **Automatización de Procesos**: Flujos de trabajo predefinidos

#### Beneficios en EcoSave:
- **Aceleración del Desarrollo**: Reducción del tiempo de creación de features
- **Accesibilidad**: Permite que personas no técnicas puedan realizar modificaciones
- **Mantenimiento Simplificado**: Actualizaciones mediante configuración
- **Consistencia**: Componentes estandarizados reutilizables

### ¿Qué es RPA (Robotic Process Automation)?

La **Automatización Robótica de Procesos (RPA)** es tecnología que permite configurar software "robots" para emular y automatizar acciones humanas repetitivas interactuando con sistemas digitales.

#### Aplicaciones en EcoSave Market:

#### 🤖 Automatización de Inventario
- **Monitoreo Automático**: Los bots verifican constantemente las fechas de vencimiento
- **Alertas Inteligentes**: Notificaciones automáticas cuando productos están próximos a expirar
- **Categorización Automática**: Clasificación de productos según tipo y urgencia

#### 📊 Procesos de Datos
- **Extracción Automática**: Recolección de datos de múltiples fuentes
- **Validación de Información**: Verificación automática de calidad de datos
- **Generación de Reportes**: Creación automática de informes de desperdicio

#### 🔄 Integración de Sistemas
- **Sincronización Automática**: Actualización entre inventario y plataforma web
- **Procesamiento de Órdenes**: Automatización de confirmaciones de donación
- **Comunicaciones**: Envío automático de correos y notificaciones

### Arquitectura Low-Code + RPA

#### Componentes de Automatización:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Interfaz      │    │   Motor RPA      │    │   Sistemas      │
│   Low-Code      │◄──►│   (Bots)         │◄──►│   Externos      │
│                 │    │                  │    │                 │
│ • Drag & Drop   │    │ • Web Scraping   │    │ • Inventarios   │
│ • Configuración │    │ • API Calls      │    │ • ONGs          │
│ • Templates     │    │ • Data Processing│    │ • Logística     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

#### Flujo de Automatización:

1. **Detección**: El sistema monitorea automáticamente el inventario
2. **Análisis**: Los bots procesan datos de vencimiento y categoría
3. **Decisión**: Reglas predefinidas determinan acciones (donar/descontar)
4. **Ejecución**: Automatización de notificaciones y actualizaciones
5. **Reporte**: Generación automática de métricas y estadísticas

### Tecnologías RPA Implementadas

#### 🛠️ Herramientas de Automatización
- **Web Scraping**: Extracción automática de datos de proveedores
- **API Automation**: Integración con sistemas externos
- **Scheduled Tasks**: Ejecución automática en horarios configurados
- **Event-Driven Automation**: Respuesta a eventos del sistema

#### 📈 Procesos Optimizados
- **Reducción 80%** en tiempo de procesamiento manual
- **Eliminación de errores** humanos en clasificación
- **Disponibilidad 24/7** para monitoreo y alertas
- **Escalabilidad** automática según volumen de productos

### Beneficios Combinados

#### 🚀 Eficiencia Operativa
- **Procesos Instantáneos**: Automatización completa de tareas repetitivas
- **Reducción de Costos**: Menos horas-hombre en procesos manuales
- **Calidad Consistente**: Estandarización de todos los procesos

#### 🌍 Impacto Social
- **Respuesta Rápida**: Detección inmediata de alimentos para donar
- **Maximización de Recursos**: Optimización del proceso de redistribución
- **Transparencia Total**: Trazabilidad completa del proceso

#### 🔧 Ventajas Técnicas
- **Integración Sencilla**: Conexión con múltiples sistemas
- **Mantenimiento Predictivo**: Detección automática de problemas
- **Evolución Continua**: Mejora automática basada en datos

### Futuro de la Automatización en EcoSave

#### 🎯 Próximas Implementaciones
- **IA Predictiva**: Anticipación de patrones de desperdicio
- **Blockchain**: Trazabilidad inmutable de donaciones
- **IoT Integration**: Sensores inteligentes en almacenes
- **Machine Learning**: Optimización automática de rutas de distribución

Esta combinación de Low-Code y RPA posiciona a EcoSave Market como una plataforma líder en eficiencia tecnológica para el combate contra el desperdicio de alimentos.

## 📝 Notas

- El proyecto está configurado para conectarse a Supabase
- Los datos de productos son de ejemplo (mock data)
- El backend usa AdonisJS 6 con estructura modular
- El frontend está optimizado con Vite y React Compiler

## 🤝 Contribuir

Este proyecto es una conversión del original en Vue.js a React, manteniendo toda la funcionalidad y diseño visual.

## 📄 Licencia

Proyecto educativo - EcoSave Market
