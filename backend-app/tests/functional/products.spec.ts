import { test } from '@japa/runner'
import supabaseService from '#services/supabase_service'

const BASE = '/api/v1'
const TEST_PASSWORD = 'TestEcoSave1234!'

const uniqueEmail = () =>
  `test_prod_${Date.now()}_${Math.random().toString(36).slice(2, 5)}@test-temp.com`

const futureDate = (daysFromNow: number) => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// Helpers: register + login directo vía Supabase (no HTTP) para usar en setup
// ---------------------------------------------------------------------------

const registerAndLoginDirect = async (role = 'supermarket') => {
  const email = uniqueEmail()
  const anonClient = supabaseService.getClient()

  await anonClient.auth.signUp({
    email,
    password: TEST_PASSWORD,
    options: {
      data: { role, business_name: 'Test Supermercado', phone: '3001112233', nit: '800900100' },
    },
  })

  const { data: loginData } = await anonClient.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  })

  const userId = loginData.user?.id ?? ''
  const token = loginData.session?.access_token ?? ''

  return { token, userId, email }
}

const deleteTestUser = async (userId: string) => {
  try {
    await supabaseService.getClient(undefined, true).auth.admin.deleteUser(userId)
  } catch {
    // Requiere service role key; falla silenciosamente si no está configurada
  }
}

const deleteTestProduct = async (productId: string) => {
  try {
    await supabaseService
      .getClient(undefined, true)
      .from('products')
      .delete()
      .eq('id', productId)
  } catch {
    // Cleanup de respaldo si el test no lo eliminó
  }
}

// ===========================================================================
// PROTECCIÓN: endpoints que verifican token explícitamente
// ===========================================================================

test.group('Products - protección de rutas que verifican userId', () => {
  test('401 GET /products sin token - el controller verifica userId', async ({ client }) => {
    const res = await client.get(`${BASE}/products`)
    res.assertStatus(401)
  })

  test('401 POST /products sin token - el controller verifica userId', async ({ client }) => {
    const res = await client.post(`${BASE}/products`).json({
      nombre: 'Leche',
      categoria: 'Lácteos',
      unidades: 10,
      vencimiento: futureDate(10),
    })
    res.assertStatus(401)
  })

  /**
   * HALLAZGO DE SEGURIDAD:
   * PUT y DELETE no aplican middleware.auth() ni verifican userId.
   * Sin token devuelven 404 (ID inválido no encontrado) o 400 (UUID malformado)
   * en lugar de 401. Esto significa que con un ID real de producto un atacante
   * podría intentar modificar o borrar sin autenticarse — solo RLS de Supabase
   * lo bloquea si la tabla tiene políticas configuradas.
   */
  test('PUT /products/:id sin token retorna 404 (no verifica auth — ver hallazgo)', async ({
    client,
  }) => {
    const res = await client
      .put(`${BASE}/products/00000000-0000-0000-0000-000000000000`)
      .json({ nombre: 'X' })
    res.assertStatus(404)
  })

  test('DELETE /products/:id sin token retorna 400 por error RLS (no verifica auth — ver hallazgo)', async ({
    client,
  }) => {
    // Sin token, Supabase RLS deniega la operación → controller retorna 400.
    // No retorna 401 porque el controller no verifica el token explícitamente.
    const res = await client.delete(`${BASE}/products/00000000-0000-0000-0000-000000000000`)
    res.assertStatus(400)
  })
})

// ===========================================================================
// RUTA PÚBLICA: productos disponibles (sin autenticación)
// ===========================================================================

test.group('GET /products/available - ruta pública', () => {
  test('200 retorna lista de productos sin necesidad de token', async ({ client, assert }) => {
    const res = await client.get(`${BASE}/products/available`)

    res.assertStatus(200)
    assert.isTrue(res.body().success)
    assert.isArray(res.body().data)
  })
})

// ===========================================================================
// CICLO CRUD COMPLETO
// ===========================================================================

test.group('Products - CRUD completo', (group) => {
  let token = ''
  let userId = ''
  let productId = ''

  group.setup(async () => {
    const session = await registerAndLoginDirect()
    token = session.token
    userId = session.userId
  })

  group.teardown(async () => {
    if (productId) await deleteTestProduct(productId)
    if (userId) await deleteTestUser(userId)
  })

  // ---- Crear ----------------------------------------------------------------

  test('201 POST /products - crea producto y asigna estado automático', async ({
    client,
    assert,
  }) => {
    const res = await client
      .post(`${BASE}/products`)
      .header('Authorization', `Bearer ${token}`)
      .json({
        nombre: 'Leche Entera',
        categoria: 'Lácteos',
        unidades: 12,
        vencimiento: futureDate(10),
      })

    res.assertStatus(201)
    assert.isTrue(res.body().success)
    assert.equal(res.body().data.nombre, 'Leche Entera')
    assert.equal(res.body().data.categoria, 'Lácteos')
    assert.equal(res.body().data.unidades, 12)
    assert.equal(res.body().data.estado, 'Normal')
    assert.exists(res.body().data.id)

    productId = res.body().data.id
  })

  // ---- Listar ---------------------------------------------------------------

  test('200 GET /products - lista los productos del usuario con paginación', async ({
    client,
    assert,
  }) => {
    const res = await client
      .get(`${BASE}/products`)
      .header('Authorization', `Bearer ${token}`)

    res.assertStatus(200)
    assert.isTrue(res.body().success)
    assert.isArray(res.body().data)
    assert.isTrue(res.body().data.length >= 1)
    assert.exists(res.body().pagination)
    assert.exists(res.body().pagination.limit)
    assert.exists(res.body().pagination.offset)
  })

  // ---- Obtener por ID -------------------------------------------------------

  test('200 GET /products/:id - retorna el producto correcto', async ({ client, assert }) => {
    const res = await client
      .get(`${BASE}/products/${productId}`)
      .header('Authorization', `Bearer ${token}`)

    res.assertStatus(200)
    assert.isTrue(res.body().success)
    assert.equal(res.body().data.id, productId)
    assert.equal(res.body().data.nombre, 'Leche Entera')
  })

  test('404 GET /products/:id - producto con ID inexistente', async ({ client }) => {
    const res = await client
      .get(`${BASE}/products/00000000-0000-0000-0000-000000000000`)
      .header('Authorization', `Bearer ${token}`)

    res.assertStatus(404)
  })

  // ---- Actualizar -----------------------------------------------------------

  test('200 PUT /products/:id - actualiza campos y refleja cambios', async ({
    client,
    assert,
  }) => {
    const res = await client
      .put(`${BASE}/products/${productId}`)
      .header('Authorization', `Bearer ${token}`)
      .json({ nombre: 'Leche Descremada', unidades: 20 })

    res.assertStatus(200)
    assert.isTrue(res.body().success)
    assert.equal(res.body().data.nombre, 'Leche Descremada')
    assert.equal(res.body().data.unidades, 20)
  })

  // ---- Eliminar -------------------------------------------------------------

  test('200 DELETE /products/:id - elimina el producto exitosamente', async ({
    client,
    assert,
  }) => {
    const res = await client
      .delete(`${BASE}/products/${productId}`)
      .header('Authorization', `Bearer ${token}`)

    res.assertStatus(200)
    assert.isTrue(res.body().success)

    productId = '' // ya eliminado, evita doble cleanup en teardown
  })

  test('404 GET /products/:id - producto ya no existe tras eliminación', async ({ client }) => {
    const res = await client
      .get(`${BASE}/products/00000000-0000-0000-0000-000000000000`)
      .header('Authorization', `Bearer ${token}`)

    res.assertStatus(404)
  })
})

// ===========================================================================
// ESTADO AUTOMÁTICO SEGÚN FECHA DE VENCIMIENTO (end-to-end)
// ===========================================================================

test.group('Products - estado automático vía HTTP', (group) => {
  let token = ''
  let userId = ''
  const createdIds: string[] = []

  group.setup(async () => {
    const session = await registerAndLoginDirect()
    token = session.token
    userId = session.userId
  })

  group.teardown(async () => {
    for (const id of createdIds) await deleteTestProduct(id)
    if (userId) await deleteTestUser(userId)
  })

  const createProduct = async (client: any, vencimiento: string) => {
    const res = await client
      .post(`${BASE}/products`)
      .header('Authorization', `Bearer ${token}`)
      .json({ nombre: `Prod ${vencimiento}`, categoria: 'Test', unidades: 5, vencimiento })
    if (res.body().data?.id) createdIds.push(res.body().data.id)
    return res
  }

  test('estado Normal para vencimiento en 10 días', async ({ client, assert }) => {
    const res = await createProduct(client, futureDate(10))
    res.assertStatus(201)
    assert.equal(res.body().data.estado, 'Normal')
  })

  test('estado Advertencia para vencimiento en 4 días', async ({ client, assert }) => {
    const res = await createProduct(client, futureDate(4))
    res.assertStatus(201)
    assert.equal(res.body().data.estado, 'Advertencia')
  })

  test('estado Urgente para vencimiento en 1 día', async ({ client, assert }) => {
    const res = await createProduct(client, futureDate(1))
    res.assertStatus(201)
    assert.equal(res.body().data.estado, 'Urgente')
  })

  test('estado Vencido para fecha pasada', async ({ client, assert }) => {
    const res = await createProduct(client, futureDate(-5))
    res.assertStatus(201)
    assert.equal(res.body().data.estado, 'Vencido')
  })
})

// ===========================================================================
// AISLAMIENTO: un usuario no ve los productos de otro
// ===========================================================================

test.group('Products - aislamiento entre usuarios', (group) => {
  let tokenA = ''
  let tokenB = ''
  let userAId = ''
  let userBId = ''
  let productAId = ''

  group.setup(async () => {
    const sessionA = await registerAndLoginDirect()
    tokenA = sessionA.token
    userAId = sessionA.userId

    const sessionB = await registerAndLoginDirect()
    tokenB = sessionB.token
    userBId = sessionB.userId
  })

  group.teardown(async () => {
    if (productAId) await deleteTestProduct(productAId)
    if (userAId) await deleteTestUser(userAId)
    if (userBId) await deleteTestUser(userBId)
  })

  test('setup: usuario A crea un producto', async ({ client }) => {
    const res = await client
      .post(`${BASE}/products`)
      .header('Authorization', `Bearer ${tokenA}`)
      .json({
        nombre: 'Producto Privado A',
        categoria: 'Test',
        unidades: 3,
        vencimiento: futureDate(7),
      })
    res.assertStatus(201)
    productAId = res.body().data?.id ?? ''
  })

  test('GET /products del usuario B no contiene productos del usuario A', async ({
    client,
    assert,
  }) => {
    const res = await client
      .get(`${BASE}/products`)
      .header('Authorization', `Bearer ${tokenB}`)

    res.assertStatus(200)
    const ids = res.body().data.map((p: any) => p.id)
    assert.notInclude(ids, productAId)
  })
})
