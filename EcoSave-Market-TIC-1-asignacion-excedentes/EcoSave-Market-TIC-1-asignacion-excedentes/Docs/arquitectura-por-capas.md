# Arquitectura por Capas — EcoSave Market

> **Archivo:** `Docs/arquitectura-por-capas.md`
> **Proyecto:** EcoSave Market TIC-1
> **Versión:** v1.0.0 (2026-04-26)
> **Universidad Pontificia Bolivariana — Medellín, 2026**

---

## Tabla de Contenidos

1. [¿Qué es la Arquitectura por Capas?](#1-qué-es-la-arquitectura-por-capas)
2. [Estructura de Capas en EcoSave Market](#2-estructura-de-capas-en-ecosave-market)
3. [Capa 1 — Controllers (HTTP)](#3-capa-1--controllers-http)
4. [Capa 2 — Services (Lógica de Negocio)](#4-capa-2--services-lógica-de-negocio)
5. [Capa 3 — Repositories (Acceso a Datos)](#5-capa-3--repositories-acceso-a-datos)
6. [Capa de Infraestructura — SupabaseService](#6-capa-de-infraestructura--supabaseservice)
7. [Reglas de Comunicación entre Capas](#7-reglas-de-comunicación-entre-capas)
8. [Flujo Completo de una Petición](#8-flujo-completo-de-una-petición)
9. [Ejemplos Correctos e Incorrectos](#9-ejemplos-correctos-e-incorrectos)
10. [Servicios de Orquestación](#10-servicios-de-orquestación)
11. [Resumen Visual](#11-resumen-visual)

---

## 1. ¿Qué es la Arquitectura por Capas?

La arquitectura por capas es un patrón de diseño de software donde el código se organiza en **niveles con responsabilidades bien definidas**. Cada capa solo puede comunicarse con la capa inmediatamente inferior, nunca puede saltarse capas.

El principio central es la **separación de responsabilidades**: cada parte del código hace una sola cosa y la hace bien. Esto facilita el mantenimiento, las pruebas y la escalabilidad del sistema.

En EcoSave Market aplicamos tres capas principales sobre el backend de AdonisJS:

```
┌─────────────────────────────────────┐
│         CLIENTE (Frontend React)    │
└────────────────────┬────────────────┘
                     │ HTTP Request
                     ▼
┌─────────────────────────────────────┐
│   CAPA 1 — Controllers              │  Recibe peticiones HTTP
│   app/controllers/http/             │  Valida entrada
└────────────────────┬────────────────┘  Devuelve respuesta JSON
                     │
                     ▼
┌─────────────────────────────────────┐
│   CAPA 2 — Services                 │  Contiene la lógica de negocio
│   app/services/                     │  Orquesta operaciones
└────────────────────┬────────────────┘  Aplica reglas del dominio
                     │
                     ▼
┌─────────────────────────────────────┐
│   CAPA 3 — Repositories             │  Accede a la base de datos
│   app/repositories/                 │  Ejecuta queries en Supabase
└────────────────────┬────────────────┘  Devuelve datos crudos
                     │
                     ▼
┌─────────────────────────────────────┐
│   INFRAESTRUCTURA — Supabase        │  PostgreSQL + Auth + Storage
│   app/services/supabase_service.ts  │
└─────────────────────────────────────┘
```

---

## 2. Estructura de Capas en EcoSave Market

La estructura real de carpetas del proyecto refleja directamente las capas:

```
backend-app/
└── app/
    ├── controllers/
    │   └── http/
    │       ├── auth_controller.ts          ← Capa 1
    │       ├── product_controller.ts       ← Capa 1
    │       ├── order_controller.ts         ← Capa 1
    │       ├── donation_controller.ts      ← Capa 1
    │       └── user_controller.ts          ← Capa 1
    │
    ├── services/
    │   ├── auth_service.ts                 ← Capa 2
    │   ├── product_service.ts              ← Capa 2
    │   ├── order_service.ts                ← Capa 2
    │   ├── donation_service.ts             ← Capa 2
    │   ├── user_service.ts                 ← Capa 2
    │   ├── order_processor_service.ts      ← Capa 2 (orquestación)
    │   ├── order_validator_service.ts      ← Capa 2 (orquestación)
    │   ├── invoice_generator_service.ts    ← Capa 2 (orquestación)
    │   ├── email_service.ts                ← Capa 2 (orquestación)
    │   └── supabase_service.ts             ← Infraestructura
    │
    └── repositories/
        ├── auth_repository.ts              ← Capa 3
        ├── product_repository.ts           ← Capa 3
        ├── order_repository.ts             ← Capa 3
        ├── donation_repository.ts          ← Capa 3
        └── user_repository.ts              ← Capa 3
```

Cada módulo de negocio (auth, product, order, donation, user) tiene exactamente **un controller, un service y un repository** que trabajan juntos verticalmente.

---

## 3. Capa 1 — Controllers (HTTP)

### Responsabilidades

- Recibir peticiones HTTP entrantes
- Extraer parámetros, body y headers de la request
- Llamar al servicio correspondiente
- Formatear y devolver la respuesta JSON
- Manejar errores HTTP (404, 400, 500, etc.)

### Lo que un Controller NO debe hacer

- Escribir queries a la base de datos
- Contener lógica de negocio (validaciones de dominio, cálculos)
- Instanciar repositorios directamente
- Llamar a repositorios de otros módulos

### Ejemplo real — `product_controller.ts`

```typescript
// app/controllers/http/product_controller.ts

export default class ProductController {
  private productService = new ProductService()

  // ✅ El controller solo: recibe la request, llama al servicio, devuelve respuesta
  async index({ request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const { limit, offset } = request.qs()

      // Delega toda la lógica al servicio
      const { data: products, error } = await this.productService.getProducts(
        accessToken,
        Number(limit) || 10,
        Number(offset) || 0
      )

      if (error) {
        return response.badRequest({ success: false, message: error.message })
      }

      return response.ok({ success: true, data: products })
    } catch (error) {
      return response.internalServerError({ success: false, message: 'Error interno' })
    }
  }
}
```

### Ejemplo real — `donation_controller.ts` (método `show`)

```typescript
async show({ params, request, response }: HttpContext) {
  try {
    const { id } = params
    const accessToken = supabaseService.getAccessToken(request.header('Authorization'))

    // El controller extrae el parámetro :id y lo pasa al servicio
    const { data: donation, error } = await this.donationService.getDonationById(accessToken, id)

    if (error || !donation) {
      return response.notFound({ success: false, message: 'Donación no encontrada' })
    }

    return response.ok({ success: true, data: donation })
  } catch (error) {
    return response.internalServerError({ success: false, message: 'Error al obtener la donación' })
  }
}
```

---

## 4. Capa 2 — Services (Lógica de Negocio)

### Responsabilidades

- Contener toda la lógica de negocio del dominio
- Validar reglas de negocio (no validación HTTP, sino reglas del dominio)
- Coordinar operaciones que involucran múltiples pasos
- Instanciar y usar los repositorios
- Ser el único punto de acceso a los datos de su dominio

### Lo que un Service NO debe hacer

- Formatear respuestas HTTP (`response.ok(...)`, `response.notFound(...)`)
- Leer directamente de `request.body()` o `request.params()`
- Instanciar repositorios de **otros** dominios directamente
- Contener código de presentación

### Ejemplo real — `product_service.ts`

```typescript
// app/services/product_service.ts

export default class ProductService {
  // El servicio instancia su propio repositorio — esto es correcto
  private getRepository(accessToken?: string, privileged = false) {
    const client = supabaseService.getClient(accessToken, privileged)
    return new ProductRepository(client)
  }

  // ✅ Lógica de negocio: aplicar filtros, paginación, reglas del dominio
  async getProducts(accessToken: string | undefined, limit: number, offset: number) {
    const repository = this.getRepository(accessToken)
    return await repository.findAll(limit, offset)
  }

  async getProductById(accessToken: string | undefined, id: string) {
    const repository = this.getRepository(accessToken)
    return await repository.findById(id)
  }

  async updateProduct(accessToken: string | undefined, id: string, data: any) {
    const repository = this.getRepository(accessToken)
    return await repository.update(id, data)
  }
}
```

### Ejemplo real — `order_service.ts` (método `updateOrderStatus`)

```typescript
// app/services/order_service.ts

async updateOrderStatus(orderId: string, status: string, extraFields?: Record<string, any>) {
  // Usa service role (privileged) para modificar cualquier orden internamente
  const repository = this.getRepository(undefined, true)

  // ✅ Lógica de negocio: siempre registra la fecha de actualización
  return await repository.update(orderId, {
    status,
    updated_at: new Date().toISOString(),
    ...extraFields,
  })
}
```

---

## 5. Capa 3 — Repositories (Acceso a Datos)

### Responsabilidades

- Ejecutar todas las operaciones de base de datos (SELECT, INSERT, UPDATE, DELETE)
- Traducir los datos crudos de Supabase al formato que necesita el sistema
- Manejar errores de base de datos
- Encapsular toda la sintaxis de Supabase para que el resto del código no sepa cómo funciona la BD

### Lo que un Repository NO debe hacer

- Contener lógica de negocio
- Llamar a otros repositorios
- Formatear respuestas HTTP
- Conocer nada sobre AdonisJS o el contexto HTTP

### Ejemplo real — `product_repository.ts`

```typescript
// app/repositories/product_repository.ts

export default class ProductRepository {
  constructor(private client: SupabaseClient) {}

  // ✅ El repositorio solo habla con la base de datos
  async findAll(limit: number, offset: number) {
    return await this.client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
  }

  async findById(id: string) {
    return await this.client
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
  }

  async create(data: any) {
    return await this.client
      .from('products')
      .insert(data)
      .select()
      .single()
  }

  async update(id: string, data: any) {
    return await this.client
      .from('products')
      .update(data)
      .eq('id', id)
      .select()
      .single()
  }

  async delete(id: string) {
    return await this.client
      .from('products')
      .delete()
      .eq('id', id)
  }
}
```

### Ejemplo real — `donation_repository.ts` (`findById`)

```typescript
async findById(id: string) {
  return await this.client
    .from('donations')
    .select('*, donor:users!donor_id(*), receiver:users!receiver_id(*)')
    .eq('id', id)
    .single()
}
```

El repositorio puede hacer queries complejas con joins, pero esa complejidad queda **encapsulada** — el service solo llama `repository.findById(id)` y no sabe nada de cómo se arma la query.

---

## 6. Capa de Infraestructura — SupabaseService

`supabase_service.ts` es un **singleton** de infraestructura. No pertenece a ninguna capa de negocio; es la pieza que provee el cliente de conexión a Supabase a quien lo necesite.

```typescript
// app/services/supabase_service.ts

class SupabaseService {
  // Retorna un cliente con el token del usuario (para respetar RLS)
  getClient(accessToken?: string, privileged = false): SupabaseClient {
    if (privileged) {
      return createClient(supabaseUrl, serviceRoleKey)  // service_role: ignora RLS
    }
    const client = createClient(supabaseUrl, anonKey)
    if (accessToken) {
      client.auth.setSession({ access_token: accessToken, refresh_token: '' })
    }
    return client
  }
}
```

### Regla de uso

- Los **Repositories** reciben el cliente ya construido en su constructor — no llaman a `supabaseService` directamente
- Los **Services** llaman a `supabaseService.getClient()` para crear el cliente y pasárselo al repositorio
- Los **Controllers** solo usan `supabaseService.getAccessToken()` para extraer el token del header

---

## 7. Reglas de Comunicación entre Capas

Estas reglas son **obligatorias** en el proyecto. Violarlas genera deuda técnica y dificulta el mantenimiento.

### Regla 1 — Comunicación solo hacia abajo

```
✅ Controller  →  Service  →  Repository  →  Supabase
❌ Controller  →  Repository   (salta la capa de servicio)
❌ Repository  →  Service      (comunicación hacia arriba)
```

### Regla 2 — Un servicio puede llamar a otro servicio del mismo nivel

```
✅ OrderProcessorService  →  OrderService
✅ OrderProcessorService  →  ProductService
✅ OrderValidatorService  →  OrderService
❌ OrderProcessorService  →  new OrderRepository(client)  (salta capas)
```

### Regla 3 — Cada dominio solo instancia su propio repositorio

```
✅ OrderService      →  new OrderRepository(client)
✅ ProductService    →  new ProductRepository(client)
❌ OrderService      →  new ProductRepository(client)   (usa ProductService en su lugar)
❌ EmailService      →  new OrderRepository(client)     (usa OrderService en su lugar)
```

### Regla 4 — Las rutas estáticas van antes que las dinámicas

```typescript
// ✅ CORRECTO — /available nunca será confundida con /:id
router.get('/available', '#controllers/http/product_controller.getAvailable')
router.get('/:id',       '#controllers/http/product_controller.show')

// ❌ INCORRECTO — "available" es capturado como el parámetro :id
router.get('/:id',       '#controllers/http/product_controller.show')
router.get('/available', '#controllers/http/product_controller.getAvailable')
```

### Regla 5 — El controller no accede a la base de datos

```typescript
// ❌ MAL — el controller instancia un repositorio directamente
async store({ request, response }: HttpContext) {
  const client = supabaseService.getClient()
  const repo = new ProductRepository(client)      // VIOLACIÓN
  const product = await repo.create(request.body())
}

// ✅ BIEN — el controller delega al servicio
async store({ request, response }: HttpContext) {
  const data = request.body()
  const result = await this.productService.createProduct(accessToken, data)  // CORRECTO
}
```

---

## 8. Flujo Completo de una Petición

### Caso: Crear una orden (`POST /api/v1/orders`)

```
1. Frontend React
   └─ fetch('POST /api/v1/orders', { body: { products, total, ... } })

2. AdonisJS Router (start/routes.ts)
   └─ router.post('/', '#controllers/http/order_controller.store')

3. OrderController.store()  [Capa 1]
   ├─ Extrae accessToken del header Authorization
   ├─ Extrae body de la request
   ├─ Llama: await this.orderService.createOrder(accessToken, body)
   └─ Devuelve: response.created({ success: true, data: order })

4. OrderService.createOrder()  [Capa 2]
   ├─ Aplica reglas de negocio (status inicial = 'pending')
   ├─ Crea el repositorio: new OrderRepository(client)
   └─ Llama: await repository.create({ ...data, status: 'pending' })

5. OrderRepository.create()  [Capa 3]
   ├─ Ejecuta: this.client.from('orders').insert(data).select().single()
   └─ Retorna: { data: order, error: null }

6. Supabase PostgreSQL
   └─ INSERT INTO orders (...) RETURNING *

7. La respuesta sube por las capas en orden inverso:
   Repository → Service → Controller → HTTP Response → Frontend
```

### Caso: Procesar una orden (flujo RPA automático)

```
order_scheduler.ts (node-cron, cada hora)
└─ orderProcessorService.processPendingOrders()

OrderProcessorService  [Capa 2 — orquestación]
├─ this.orderService.getOrders(undefined, 10, 0, 'pending')  → OrderService
├─ orderValidatorService.validateOrder(orderId)
│   └─ this.orderService.getOrderById(...)                   → OrderService
│   └─ this.productService.getProductById(...)               → ProductService
├─ invoiceGeneratorService.generateInvoice(orderId)
│   └─ this.orderService.getOrderById(...)                   → OrderService
├─ emailService.sendOrderConfirmation(orderId)
│   └─ this.orderService.getOrderById(...)                   → OrderService
└─ this.orderService.updateOrderStatus(orderId, 'completed') → OrderService
```

Nótese que `OrderProcessorService` **nunca instancia un repositorio directamente**. Siempre pasa por los servicios correspondientes.

---

## 9. Ejemplos Correctos e Incorrectos

### Ejemplo 1 — Obtener datos de una orden en un servicio auxiliar

```typescript
// ❌ INCORRECTO — invoice_generator_service antes de la corrección
async generateInvoice(orderId: string) {
  const client = supabaseService.getClient(undefined, true)
  const orderRepository = new OrderRepository(client)           // VIOLA la arquitectura
  const { data: order } = await orderRepository.findById(orderId)
  // ...
}

// ✅ CORRECTO — invoice_generator_service después de la corrección
class InvoiceGeneratorService {
  private orderService = new OrderService()    // Usa el servicio, no el repositorio

  async generateInvoice(orderId: string) {
    const { data: order } = await this.orderService.getOrderById(undefined, orderId)
    // ...
  }
}
```

### Ejemplo 2 — Actualizar el estado de una orden desde el procesador

```typescript
// ❌ INCORRECTO
async updateOrderStatus(orderId: string, status: string) {
  const client = supabaseService.getClient(undefined, true)
  const repo = new OrderRepository(client)                      // VIOLA la arquitectura
  await repo.update(orderId, { status })
}

// ✅ CORRECTO
async updateOrderStatus(orderId: string, status: string) {
  await this.orderService.updateOrderStatus(orderId, status)    // Delega a OrderService
}
```

### Ejemplo 3 — Validar stock en OrderValidatorService

```typescript
// ❌ INCORRECTO
private async validateStock(products: OrderProduct[]) {
  const client = supabaseService.getClient(undefined, true)
  const productRepo = new ProductRepository(client)             // VIOLA la arquitectura
  const { data } = await productRepo.findById(product.product_id)
}

// ✅ CORRECTO
private async validateStock(products: OrderProduct[]) {
  const { data: productData } = await this.productService.getProductById(
    undefined,
    product.product_id
  )
}
```

---

## 10. Servicios de Orquestación

El proyecto tiene cuatro servicios que coordinan múltiples operaciones. Son parte de la Capa 2 (servicios), pero tienen un rol especial: **orquestar** el trabajo de otros servicios sin hablar directamente con repositorios ajenos.

| Servicio | Rol | Servicios que usa |
|---|---|---|
| `order_processor_service.ts` | Orquesta el flujo completo de una orden | `OrderService`, `ProductService` |
| `order_validator_service.ts` | Valida datos y stock antes de procesar | `OrderService`, `ProductService` |
| `invoice_generator_service.ts` | Genera el PDF de la factura | `OrderService` |
| `email_service.ts` | Envía correos de confirmación y estado | `OrderService` |

Todos estos servicios se registran como **singletons** (`export default new XxxService()`), lo que significa que se instancian una sola vez y se comparten en toda la aplicación.

---

## 11. Resumen Visual

### Mapa completo de dependencias en EcoSave Market

```
                    ┌─────────────────────────────────────────────┐
                    │           CAPA 1 — CONTROLLERS              │
                    ├──────────┬──────────┬──────────┬────────────┤
                    │ AuthCtrl │ ProdCtrl │ OrdCtrl  │ DonCtrl    │
                    └────┬─────┴────┬─────┴────┬─────┴─────┬──────┘
                         │          │          │           │
                         ▼          ▼          ▼           ▼
          ┌──────────────────────────────────────────────────────────────┐
          │                   CAPA 2 — SERVICES                         │
          │                                                              │
          │  AuthService  ProductService  OrderService  DonationService  │
          │                                    ▲                        │
          │                    ┌───────────────┼────────────────────┐   │
          │                    │               │                    │   │
          │  OrderProcessor ───┤     OrderValidator    EmailService │   │
          │  Service            │     Service           │           │   │
          │                    │               │       InvoiceGen   │   │
          │                    └───────────────┴────────Service─────┘   │
          └───────┬───────────────────┬──────────────────────┬──────────┘
                  │                   │                      │
                  ▼                   ▼                      ▼
          ┌─────────────────────────────────────────────────────────────┐
          │                   CAPA 3 — REPOSITORIES                    │
          ├──────────────┬──────────────────┬───────────────────────────┤
          │ AuthRepo     │ ProductRepo      │ OrderRepo  DonationRepo   │
          └──────────────┴──────────────────┴───────────────────────────┘
                                    │
                                    ▼
          ┌─────────────────────────────────────────────────────────────┐
          │              INFRAESTRUCTURA — SUPABASE                    │
          │          PostgreSQL + Auth + Storage + RLS                  │
          └─────────────────────────────────────────────────────────────┘
```

### Checklist para nuevas funcionalidades

Antes de agregar código al proyecto, verificar:

- [ ] ¿El controller solo recibe la request y llama al servicio?
- [ ] ¿El servicio contiene la lógica de negocio y usa solo su propio repositorio?
- [ ] ¿Si el servicio necesita datos de otro dominio, llama al servicio de ese dominio?
- [ ] ¿El repositorio solo contiene queries a Supabase?
- [ ] ¿Las rutas estáticas están registradas antes que las dinámicas (`/:id`)?
- [ ] ¿Cada endpoint del controller tiene su método correspondiente en el service y repository?

---

*Universidad Pontificia Bolivariana — Medellín, 2026 | Proyecto TIC-1*
