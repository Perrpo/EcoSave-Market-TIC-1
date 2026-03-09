# 🎭 Sistema de Roles - EcoSave Market

## Descripción

Sistema de roles para diferenciar entre **Supermercados** y **ONGs** con dashboards personalizados para cada tipo de usuario.

---

## 🏗️ Arquitectura

### Roles Disponibles

1. **`supermarket`** - Supermercados que donan alimentos
2. **`ong`** - ONGs que reciben donaciones

### Flujo de Usuario

```
Registro → Selecciona Rol → Completa Datos → Registro Exitoso
   ↓
Login → Sistema detecta rol automáticamente
   ↓
Redirección automática:
   - Supermercado → /dashboard
   - ONG → /dashboard-ong
```

---

## 📋 Campos del Formulario de Registro

### Campos Requeridos:

1. **Rol** (Selector)
   - 🏪 Supermercado
   - 🤝 ONG

2. **Nombre o Razón Social** (Texto)
   - Nombre del negocio u organización

3. **Correo Electrónico** (Email)
   - Email para login y notificaciones

4. **Teléfono** (Tel)
   - Número de contacto

5. **NIT** (Texto)
   - Número de Identificación Tributaria

6. **Contraseña** (Password)
   - Contraseña segura para la cuenta

---

## 🔐 Login

### Comportamiento

- **NO** se solicita el rol en el login
- El sistema detecta automáticamente el rol del usuario
- Redirige al dashboard correspondiente según el rol

### Redirección Automática

```typescript
if (user.role === 'ong') {
  navigate('/dashboard-ong')
} else {
  navigate('/dashboard')
}
```

---

## 💾 Almacenamiento de Datos

### Supabase Auth Metadata

Los datos del usuario se guardan en `user_metadata`:

```json
{
  "business_name": "Supermercado El Ahorro",
  "phone": "555-1234",
  "nit": "900123456-7",
  "role": "supermarket"
}
```

### Estructura del Usuario en Frontend

```typescript
interface User {
  id: string;
  email: string;
  businessName: string;
  phone: string;
  nit: string;
  role: 'supermarket' | 'ong';
}
```

---

## 🎨 Dashboards

### Dashboard Supermercado (`/dashboard`)

**Funcionalidades:**
- ✅ Ver inventario de productos próximos a vencer
- ✅ Crear donaciones de alimentos
- ✅ Ver historial de donaciones
- ✅ Estadísticas de impacto
- ✅ Gestión de productos

### Dashboard ONG (`/dashboard-ong`)

**Funcionalidades (a implementar):**
- ✅ Ver donaciones disponibles
- ✅ Solicitar alimentos
- ✅ Ver historial de recepciones
- ✅ Mapa de puntos de recolección
- ✅ Estadísticas de alimentos recibidos

---

## 🔧 Implementación Técnica

### Frontend

#### 1. AuthForm.tsx
```typescript
// Estado del rol
const [role, setRole] = useState<'supermarket' | 'ong'>('supermarket');

// Selector de rol
<select value={role} onChange={(e) => setRole(e.target.value)}>
  <option value="supermarket">🏪 Supermercado</option>
  <option value="ong">🤝 ONG</option>
</select>

// Registro con rol
await auth.register(email, password, businessName, phone, nit, role);

// Login con redirección automática
if (auth.user?.role === 'ong') {
  navigate('/dashboard-ong');
} else {
  navigate('/dashboard');
}
```

#### 2. AuthContext.tsx
```typescript
interface User {
  id: string;
  email: string;
  businessName: string;
  phone: string;
  nit: string;
  role: 'supermarket' | 'ong';
}

const register = async (
  email: string,
  password: string,
  businessName: string,
  phone: string,
  nit: string,
  role: 'supermarket' | 'ong'
) => {
  // Envía role al backend
  body: JSON.stringify({ email, password, business_name: businessName, phone, nit, role })
}
```

### Backend

#### auth_controller.ts
```typescript
// Recibir rol en registro
const { email, password, business_name, phone, nit, role } = request.only([...])

// Validar rol
if (role !== 'supermarket' && role !== 'ong') {
  return response.badRequest({
    message: 'Role must be either "supermarket" or "ong"'
  })
}

// Guardar en Supabase metadata
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      business_name,
      phone,
      nit,
      role  // ← Guardado aquí
    }
  }
})

// Retornar rol en login
user: {
  id: authData.user?.id,
  email: authData.user?.email,
  businessName: authData.user?.user_metadata?.business_name,
  phone: authData.user?.user_metadata?.phone,
  nit: authData.user?.user_metadata?.nit,
  role: authData.user?.user_metadata?.role  // ← Retornado aquí
}
```

---

## 🚀 Próximos Pasos

### 1. Crear Dashboard ONG
- [ ] Crear componente `DashboardONG.tsx`
- [ ] Agregar ruta `/dashboard-ong` en `App.tsx`
- [ ] Diseñar interfaz específica para ONGs
- [ ] Implementar funcionalidades de recepción de donaciones

### 2. Protección de Rutas
- [ ] Middleware para verificar rol
- [ ] Prevenir acceso de ONGs al dashboard de supermercados
- [ ] Prevenir acceso de supermercados al dashboard de ONGs

### 3. Funcionalidades Específicas

**Para Supermercados:**
- [ ] Sistema de alertas de vencimiento
- [ ] Generación automática de donaciones
- [ ] Reportes de impacto ambiental

**Para ONGs:**
- [ ] Sistema de solicitud de alimentos
- [ ] Calendario de recolecciones
- [ ] Gestión de beneficiarios

---

## 🧪 Pruebas

### Registrar Supermercado
1. Ir a `/` (página de login)
2. Click en "Create account"
3. Seleccionar "🏪 Supermercado"
4. Completar todos los campos
5. Click en "SIGN UP"
6. Iniciar sesión
7. Verificar redirección a `/dashboard`

### Registrar ONG
1. Ir a `/` (página de login)
2. Click en "Create account"
3. Seleccionar "🤝 ONG"
4. Completar todos los campos
5. Click en "SIGN UP"
6. Iniciar sesión
7. Verificar redirección a `/dashboard-ong`

---

## 📝 Notas Importantes

- ✅ El rol se guarda en el **registro**, no en el login
- ✅ El rol es **inmutable** una vez registrado
- ✅ La redirección es **automática** según el rol
- ✅ Cada rol tiene su **dashboard específico**
- ⚠️ Actualmente solo existe el dashboard de supermercado
- ⚠️ El dashboard de ONG debe ser creado

---

## 🔗 Archivos Modificados

### Frontend
- `frontend-app/src/components/AuthForm.tsx`
- `frontend-app/src/context/AuthContext.tsx`

### Backend
- `backend-app/app/controllers/http/auth_controller.ts`

---

## 🎯 Beneficios del Sistema de Roles

1. **Experiencia Personalizada** - Cada usuario ve solo lo relevante para su rol
2. **Seguridad** - Separación clara de funcionalidades
3. **Escalabilidad** - Fácil agregar nuevos roles en el futuro
4. **UX Mejorada** - No se pregunta el rol en cada login
5. **Datos Estructurados** - Información organizada por tipo de usuario
