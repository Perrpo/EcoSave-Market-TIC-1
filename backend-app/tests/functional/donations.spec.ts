import { test } from '@japa/runner'
import supabaseService from '#services/supabase_service'

const BASE = '/api/v1'
const TEST_PASSWORD = 'TestEcoSave1234!'

const uniqueEmail = () =>
  `test_don_${Date.now()}_${Math.random().toString(36).slice(2, 5)}@test-temp.com`

const futureDate = (daysFromNow: number) => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const registerAndLoginDirect = async (role = 'supermarket') => {
  const email = uniqueEmail()
  const anonClient = supabaseService.getClient()

  await anonClient.auth.signUp({
    email,
    password: TEST_PASSWORD,
    options: {
      data: { role, business_name: `Test ${role}`, phone: '3001112233', nit: '800900100' },
    },
  })

  const { data: loginData } = await anonClient.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  })

  return {
    token: loginData.session?.access_token ?? '',
    userId: loginData.user?.id ?? '',
  }
}

const deleteTestUser = async (userId: string) => {
  try {
    await supabaseService.getClient(undefined, true).auth.admin.deleteUser(userId)
  } catch {
    // Requiere service role key
  }
}

const deleteTestDonation = async (donationId: string) => {
  try {
    await supabaseService
      .getClient(undefined, true)
      .from('donations')
      .delete()
      .eq('id', donationId)
  } catch {}
}

const deleteTestProduct = async (productId: string) => {
  try {
    await supabaseService
      .getClient(undefined, true)
      .from('products')
      .delete()
      .eq('id', productId)
  } catch {}
}

// ===========================================================================
// PROTECCIÓN: endpoints que verifican userId
// ===========================================================================

test.group('Donations - protección de rutas autenticadas', () => {
  test('401 GET /donations sin token', async ({ client }) => {
    const res = await client.get(`${BASE}/donations`)
    res.assertStatus(401)
  })

  test('401 POST /donations sin token', async ({ client }) => {
    const res = await client
      .post(`${BASE}/donations`)
      .json({ product_id: 'x', quantity: 1 })
    res.assertStatus(401)
  })

  test('401 POST /donations/:id/request sin token', async ({ client }) => {
    const res = await client
      .post(`${BASE}/donations/00000000-0000-0000-0000-000000000000/request`)
      .json({})
    res.assertStatus(401)
  })

  test('401 POST /donations/:id/confirm sin token', async ({ client }) => {
    const res = await client.post(
      `${BASE}/donations/00000000-0000-0000-0000-000000000000/confirm`
    )
    res.assertStatus(401)
  })

  test('401 GET /donations/stats sin token', async ({ client }) => {
    const res = await client.get(`${BASE}/donations/stats`)
    res.assertStatus(401)
  })
})

// ===========================================================================
// RUTA PÚBLICA
// ===========================================================================

test.group('GET /donations/available - ruta pública', () => {
  test('200 retorna lista de donaciones disponibles sin token', async ({ client, assert }) => {
    const res = await client.get(`${BASE}/donations/available`)

    res.assertStatus(200)
    assert.isTrue(res.body().success)
    assert.isArray(res.body().data)
  })
})

// ===========================================================================
// CICLO COMPLETO: available → requested → completed
// ===========================================================================

test.group('Donations - ciclo completo available → requested → completed', (group) => {
  let superToken = ''
  let superUserId = ''
  let ongToken = ''
  let ongUserId = ''
  let productId = ''
  let donationId = ''

  group.setup(async () => {
    // Crear supermercado y ONG
    const superSession = await registerAndLoginDirect('supermarket')
    superToken = superSession.token
    superUserId = superSession.userId

    const ongSession = await registerAndLoginDirect('ong')
    ongToken = ongSession.token
    ongUserId = ongSession.userId

    // Crear producto que el supermercado va a donar
    const adminClient = supabaseService.getClient(undefined, true)
    const { data: product } = await adminClient
      .from('products')
      .insert({
        user_id: superUserId,
        nombre: 'Leche Donada Test',
        categoria: 'Lácteos',
        unidades: 20,
        vencimiento: futureDate(3),
        estado: 'Advertencia',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    productId = product?.id ?? ''
  })

  group.teardown(async () => {
    if (donationId) await deleteTestDonation(donationId)
    if (productId) await deleteTestProduct(productId)
    if (superUserId) await deleteTestUser(superUserId)
    if (ongUserId) await deleteTestUser(ongUserId)
  })

  // ---- Crear donación (supermercado) ----------------------------------------

  test('201 POST /donations - supermercado crea donación con status available', async ({
    client,
    assert,
  }) => {
    const res = await client
      .post(`${BASE}/donations`)
      .header('Authorization', `Bearer ${superToken}`)
      .json({ product_id: productId, quantity: 10 })

    res.assertStatus(201)
    assert.isTrue(res.body().success)
    assert.equal(res.body().data.status, 'available')
    assert.equal(res.body().data.quantity, 10)
    assert.equal(res.body().data.user_id, superUserId)
    assert.exists(res.body().data.id)

    donationId = res.body().data.id
  })

  // ---- Listar donaciones del supermercado ------------------------------------

  test('200 GET /donations - supermercado ve su propia donación en la lista', async ({
    client,
    assert,
  }) => {
    const res = await client
      .get(`${BASE}/donations`)
      .header('Authorization', `Bearer ${superToken}`)

    res.assertStatus(200)
    assert.isTrue(res.body().success)
    assert.isArray(res.body().data)
    const ids = res.body().data.map((d: any) => d.id)
    assert.include(ids, donationId)
  })

  // ---- Disponible para ONGs -------------------------------------------------

  test('200 GET /donations/available - donación aparece en lista pública de disponibles', async ({
    client,
    assert,
  }) => {
    const res = await client.get(`${BASE}/donations/available`)

    res.assertStatus(200)
    const ids = res.body().data.map((d: any) => d.id)
    assert.include(ids, donationId)
  })

  // ---- ONG solicita la donación ---------------------------------------------

  test('200 POST /donations/:id/request - ONG solicita la donación completa', async ({
    client,
    assert,
  }) => {
    const res = await client
      .post(`${BASE}/donations/${donationId}/request`)
      .header('Authorization', `Bearer ${ongToken}`)
      .json({})

    res.assertStatus(200)
    assert.isTrue(res.body().success)
    assert.equal(res.body().data.status, 'requested')
    assert.equal(res.body().data.ong_id, ongUserId)
  })

  // ---- Donación ya no aparece como disponible -------------------------------

  test('GET /donations/available - donación ya no aparece tras ser solicitada', async ({
    client,
    assert,
  }) => {
    const res = await client.get(`${BASE}/donations/available`)

    res.assertStatus(200)
    const ids = res.body().data.map((d: any) => d.id)
    assert.notInclude(ids, donationId)
  })

  // ---- Confirmar recepción --------------------------------------------------

  test('200 POST /donations/:id/confirm - ONG confirma recepción → status completed', async ({
    client,
    assert,
  }) => {
    const res = await client
      .post(`${BASE}/donations/${donationId}/confirm`)
      .header('Authorization', `Bearer ${ongToken}`)

    res.assertStatus(200)
    assert.isTrue(res.body().success)
    assert.equal(res.body().data.status, 'completed')
  })

  // ---- Estadísticas post-ciclo ----------------------------------------------

  test('200 GET /donations/stats - refleja 1 donación completada', async ({
    client,
    assert,
  }) => {
    const res = await client
      .get(`${BASE}/donations/stats`)
      .header('Authorization', `Bearer ${superToken}`)

    res.assertStatus(200)
    assert.isTrue(res.body().success)
    assert.exists(res.body().data.total)
    assert.exists(res.body().data.completed)
    assert.isTrue(res.body().data.completed >= 1)
  })
})

// ===========================================================================
// CICLO PARCIAL: solicitud de cantidad menor que el total disponible
// ===========================================================================

test.group('Donations - solicitud parcial (split de donación)', (group) => {
  let superToken = ''
  let superUserId = ''
  let ongToken = ''
  let ongUserId = ''
  let productId = ''
  let donationId = ''

  group.setup(async () => {
    const superSession = await registerAndLoginDirect('supermarket')
    superToken = superSession.token
    superUserId = superSession.userId

    const ongSession = await registerAndLoginDirect('ong')
    ongToken = ongSession.token
    ongUserId = ongSession.userId

    const adminClient = supabaseService.getClient(undefined, true)
    const { data: product } = await adminClient
      .from('products')
      .insert({
        user_id: superUserId,
        nombre: 'Yogur Split Test',
        categoria: 'Lácteos',
        unidades: 20,
        vencimiento: futureDate(4),
        estado: 'Advertencia',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    productId = product?.id ?? ''
  })

  group.teardown(async () => {
    // Limpiar donaciones residuales del split
    if (superUserId) {
      await supabaseService
        .getClient(undefined, true)
        .from('donations')
        .delete()
        .eq('user_id', superUserId)
    }
    if (productId) await deleteTestProduct(productId)
    if (superUserId) await deleteTestUser(superUserId)
    if (ongUserId) await deleteTestUser(ongUserId)
  })

  test('201 supermercado crea donación de 10 unidades', async ({ client, assert }) => {
    const res = await client
      .post(`${BASE}/donations`)
      .header('Authorization', `Bearer ${superToken}`)
      .json({ product_id: productId, quantity: 10 })

    res.assertStatus(201)
    donationId = res.body().data.id
    assert.equal(res.body().data.quantity, 10)
  })

  test('200 ONG solicita solo 4 de 10 unidades → donación se divide', async ({
    client,
    assert,
  }) => {
    const res = await client
      .post(`${BASE}/donations/${donationId}/request`)
      .header('Authorization', `Bearer ${ongToken}`)
      .json({ quantity: 4 })

    res.assertStatus(200)
    assert.equal(res.body().data.status, 'requested')
    assert.equal(res.body().data.quantity, 4)
  })

  test('GET /donations/available - las 6 unidades restantes siguen disponibles', async ({
    client,
    assert,
  }) => {
    const res = await client.get(`${BASE}/donations/available`)

    res.assertStatus(200)
    const remainder = res.body().data.find(
      (d: any) => d.user_id === superUserId && d.quantity === 6
    )
    assert.exists(remainder, 'Debe existir una donación de 6 unidades como remanente')
  })
})

// ===========================================================================
// VALIDACIONES DE NEGOCIO: transiciones de estado inválidas
// ===========================================================================

test.group('Donations - validaciones de estado HTTP', (group) => {
  let superToken = ''
  let superUserId = ''
  let ongToken = ''
  let ongUserId = ''
  let productId = ''
  let availableDonationId = ''
  let requestedDonationId = ''
  let completedDonationId = ''

  group.setup(async () => {
    const superSession = await registerAndLoginDirect('supermarket')
    superToken = superSession.token
    superUserId = superSession.userId

    const ongSession = await registerAndLoginDirect('ong')
    ongToken = ongSession.token
    ongUserId = ongSession.userId

    const adminClient = supabaseService.getClient(undefined, true)

    // Crear producto base
    const { data: product } = await adminClient
      .from('products')
      .insert({
        user_id: superUserId,
        nombre: 'Prod Validación',
        categoria: 'Test',
        unidades: 30,
        vencimiento: futureDate(5),
        estado: 'Advertencia',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    productId = product?.id ?? ''

    // Donación en estado 'requested' (preconfigurada directo en BD)
    const { data: reqDon } = await adminClient
      .from('donations')
      .insert({
        product_id: productId,
        user_id: superUserId,
        ong_id: ongUserId,
        quantity: 5,
        product_name: 'Prod Validación',
        product_category: 'Test',
        expiry_date: futureDate(5),
        status: 'requested',
      })
      .select()
      .single()
    requestedDonationId = reqDon?.id ?? ''

    // Donación en estado 'completed' (preconfigurada directo en BD)
    const { data: compDon } = await adminClient
      .from('donations')
      .insert({
        product_id: productId,
        user_id: superUserId,
        ong_id: ongUserId,
        quantity: 3,
        product_name: 'Prod Validación',
        product_category: 'Test',
        expiry_date: futureDate(5),
        status: 'completed',
      })
      .select()
      .single()
    completedDonationId = compDon?.id ?? ''

    // Donación en estado 'available'
    const { data: avDon } = await adminClient
      .from('donations')
      .insert({
        product_id: productId,
        user_id: superUserId,
        quantity: 4,
        product_name: 'Prod Validación',
        product_category: 'Test',
        expiry_date: futureDate(5),
        status: 'available',
      })
      .select()
      .single()
    availableDonationId = avDon?.id ?? ''
  })

  group.teardown(async () => {
    for (const id of [availableDonationId, requestedDonationId, completedDonationId]) {
      if (id) await deleteTestDonation(id)
    }
    if (productId) await deleteTestProduct(productId)
    if (superUserId) await deleteTestUser(superUserId)
    if (ongUserId) await deleteTestUser(ongUserId)
  })

  test('400 request sobre donación ya solicitada (status: requested)', async ({ client }) => {
    const res = await client
      .post(`${BASE}/donations/${requestedDonationId}/request`)
      .header('Authorization', `Bearer ${ongToken}`)
      .json({})

    res.assertStatus(400)
  })

  test('400 request sobre donación ya completada (status: completed)', async ({ client }) => {
    const res = await client
      .post(`${BASE}/donations/${completedDonationId}/request`)
      .header('Authorization', `Bearer ${ongToken}`)
      .json({})

    res.assertStatus(400)
  })

  test('400 confirm sobre donación que sigue disponible (status: available)', async ({
    client,
  }) => {
    const res = await client
      .post(`${BASE}/donations/${availableDonationId}/confirm`)
      .header('Authorization', `Bearer ${ongToken}`)

    res.assertStatus(400)
  })

  test('400 confirm sobre donación ya completada', async ({ client }) => {
    const res = await client
      .post(`${BASE}/donations/${completedDonationId}/confirm`)
      .header('Authorization', `Bearer ${ongToken}`)

    res.assertStatus(400)
  })

  test('400 request con cantidad mayor que el disponible', async ({ client }) => {
    const res = await client
      .post(`${BASE}/donations/${availableDonationId}/request`)
      .header('Authorization', `Bearer ${ongToken}`)
      .json({ quantity: 999 })

    res.assertStatus(400)
  })

  test('400 request con cantidad 0', async ({ client }) => {
    const res = await client
      .post(`${BASE}/donations/${availableDonationId}/request`)
      .header('Authorization', `Bearer ${ongToken}`)
      .json({ quantity: 0 })

    res.assertStatus(400)
  })

  test('404 GET /donations/:id con ID inexistente', async ({ client }) => {
    const res = await client
      .get(`${BASE}/donations/00000000-0000-0000-0000-000000000000`)
      .header('Authorization', `Bearer ${superToken}`)

    res.assertStatus(404)
  })

  test('200 GET /donations/stats retorna estructura correcta', async ({ client, assert }) => {
    const res = await client
      .get(`${BASE}/donations/stats`)
      .header('Authorization', `Bearer ${superToken}`)

    res.assertStatus(200)
    assert.isTrue(res.body().success)
    assert.exists(res.body().data.total)
    assert.exists(res.body().data.available)
    assert.exists(res.body().data.requested)
    assert.exists(res.body().data.completed)
    assert.exists(res.body().data.totalItems)
  })
})
