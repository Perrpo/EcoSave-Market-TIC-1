import { test } from '@japa/runner'
import supabaseService from '#services/supabase_service'

const BASE = '/api/v1'
const TEST_PASSWORD = 'TestEcoSave1234!'

const uniqueEmail = () =>
  `test_ecosave_${Date.now()}_${Math.random().toString(36).slice(2, 5)}@test-temp.com`

// ---------------------------------------------------------------------------
// Helpers de cleanup: borra usuarios de prueba vía Supabase Admin API.
// Requiere service role key. Si falla, los tests igual pasan y el usuario
// queda como residuo identificable por el prefijo "test_ecosave_".
// ---------------------------------------------------------------------------
const deleteTestUser = async (userId: string) => {
  try {
    await supabaseService.getClient(undefined, true).auth.admin.deleteUser(userId)
  } catch {
    // Si no hay service role key disponible, el cleanup falla silenciosamente
  }
}

// ===========================================================================
// REGISTER - Validaciones (no crean usuarios)
// ===========================================================================

test.group('POST /auth/register - validaciones de campos', () => {
  test('400 cuando falta el email', async ({ client }) => {
    const res = await client.post(`${BASE}/auth/register`).json({
      password: TEST_PASSWORD,
      business_name: 'Test Corp',
      phone: '3001234567',
      nit: '900123456',
      role: 'supermarket',
    })

    res.assertStatus(400)
  })

  test('400 cuando falta la contraseña', async ({ client }) => {
    const res = await client.post(`${BASE}/auth/register`).json({
      email: uniqueEmail(),
      business_name: 'Test Corp',
      phone: '3001234567',
      nit: '900123456',
      role: 'supermarket',
    })

    res.assertStatus(400)
  })

  test('400 cuando falta el nombre del negocio', async ({ client }) => {
    const res = await client.post(`${BASE}/auth/register`).json({
      email: uniqueEmail(),
      password: TEST_PASSWORD,
      phone: '3001234567',
      nit: '900123456',
      role: 'supermarket',
    })

    res.assertStatus(400)
  })

  test('400 cuando falta el teléfono', async ({ client }) => {
    const res = await client.post(`${BASE}/auth/register`).json({
      email: uniqueEmail(),
      password: TEST_PASSWORD,
      business_name: 'Test Corp',
      nit: '900123456',
      role: 'supermarket',
    })

    res.assertStatus(400)
  })

  test('400 cuando falta el NIT', async ({ client }) => {
    const res = await client.post(`${BASE}/auth/register`).json({
      email: uniqueEmail(),
      password: TEST_PASSWORD,
      business_name: 'Test Corp',
      phone: '3001234567',
      role: 'supermarket',
    })

    res.assertStatus(400)
  })

  test('400 cuando el rol es inválido', async ({ client }) => {
    const res = await client.post(`${BASE}/auth/register`).json({
      email: uniqueEmail(),
      password: TEST_PASSWORD,
      business_name: 'Test Corp',
      phone: '3001234567',
      nit: '900123456',
      role: 'hacker',
    })

    res.assertStatus(400)
  })

  test('400 cuando el cuerpo está completamente vacío', async ({ client }) => {
    const res = await client.post(`${BASE}/auth/register`).json({})

    res.assertStatus(400)
  })
})

// ===========================================================================
// LOGIN - Validaciones (no requieren usuario existente)
// ===========================================================================

test.group('POST /auth/login - validaciones de campos', () => {
  test('400 cuando falta el email', async ({ client }) => {
    const res = await client.post(`${BASE}/auth/login`).json({
      password: TEST_PASSWORD,
    })

    res.assertStatus(400)
  })

  test('400 cuando falta la contraseña', async ({ client }) => {
    const res = await client.post(`${BASE}/auth/login`).json({
      email: 'alguien@example.com',
    })

    res.assertStatus(400)
  })

  test('400 cuando el rol enviado no es válido', async ({ client }) => {
    const res = await client.post(`${BASE}/auth/login`).json({
      email: 'alguien@example.com',
      password: TEST_PASSWORD,
      role: 'invalido',
    })

    res.assertStatus(400)
  })

  test('401 con credenciales de usuario inexistente', async ({ client }) => {
    const res = await client.post(`${BASE}/auth/login`).json({
      email: 'noexiste_xyzxyz@never.com',
      password: TEST_PASSWORD,
    })

    res.assertStatus(401)
  })

  test('401 con contraseña incorrecta', async ({ client }) => {
    const res = await client.post(`${BASE}/auth/login`).json({
      email: 'noexiste_xyzxyz@never.com',
      password: 'ContraseñaIncorrecta999!',
    })

    res.assertStatus(401)
  })
})

// ===========================================================================
// LOGOUT - Validaciones de autenticación
// ===========================================================================

test.group('POST /auth/logout - validaciones de token', () => {
  test('401 cuando no se envía el header Authorization', async ({ client }) => {
    const res = await client.post(`${BASE}/auth/logout`)

    res.assertStatus(401)
  })

  test('401 con token inválido', async ({ client }) => {
    const res = await client
      .post(`${BASE}/auth/logout`)
      .header('Authorization', 'Bearer token-completamente-invalido')

    res.assertStatus(401)
  })

  test('401 con header Authorization vacío', async ({ client }) => {
    const res = await client.post(`${BASE}/auth/logout`).header('Authorization', '')

    res.assertStatus(401)
  })
})

// ===========================================================================
// FLUJO COMPLETO: Register → Login → Logout
// Crea un usuario real en Supabase y lo elimina al finalizar.
// ===========================================================================

test.group('Flujo completo de autenticación', (group) => {
  const testEmail = uniqueEmail()
  let registeredUserId = ''
  let sessionToken = ''

  group.teardown(async () => {
    if (registeredUserId) {
      await deleteTestUser(registeredUserId)
    }
  })

  test('201 - registro exitoso de supermercado', async ({ client, assert }) => {
    const res = await client.post(`${BASE}/auth/register`).json({
      email: testEmail,
      password: TEST_PASSWORD,
      business_name: 'Supermercado Prueba Funcional',
      phone: '3009876543',
      nit: '999888777',
      role: 'supermarket',
    })

    res.assertStatus(201)
    assert.equal(res.body().message, 'User registered successfully')
    assert.exists(res.body().user)
    assert.equal(res.body().user.email, testEmail)
    assert.equal(res.body().user.role, 'supermarket')
    assert.exists(res.body().user.id)

    registeredUserId = res.body().user.id
  })

  test('200 - login con credenciales correctas retorna token y datos del usuario', async ({
    client,
    assert,
  }) => {
    const res = await client.post(`${BASE}/auth/login`).json({
      email: testEmail,
      password: TEST_PASSWORD,
    })

    res.assertStatus(200)
    assert.equal(res.body().message, 'Login successful')
    assert.exists(res.body().token)
    assert.isString(res.body().token)
    assert.exists(res.body().user)
    assert.equal(res.body().user.email, testEmail)
    assert.equal(res.body().user.role, 'supermarket')

    sessionToken = res.body().token
  })

  test('200 - logout exitoso con token válido', async ({ client, assert }) => {
    const res = await client
      .post(`${BASE}/auth/logout`)
      .header('Authorization', `Bearer ${sessionToken}`)

    res.assertStatus(200)
    assert.equal(res.body().message, 'Logout successful')
  })
})

test.group('Flujo completo de autenticación - registro de ONG', (group) => {
  const testEmail = uniqueEmail()
  let registeredUserId = ''

  group.teardown(async () => {
    if (registeredUserId) {
      await deleteTestUser(registeredUserId)
    }
  })

  test('201 - registro exitoso de ONG', async ({ client, assert }) => {
    const res = await client.post(`${BASE}/auth/register`).json({
      email: testEmail,
      password: TEST_PASSWORD,
      business_name: 'ONG Ayuda Funcional',
      phone: '3107654321',
      nit: '111222333',
      role: 'ong',
    })

    res.assertStatus(201)
    assert.equal(res.body().user.role, 'ong')

    registeredUserId = res.body().user.id
  })

  test('200 - ONG puede hacer login y tiene rol correcto', async ({ client, assert }) => {
    const res = await client.post(`${BASE}/auth/login`).json({
      email: testEmail,
      password: TEST_PASSWORD,
    })

    res.assertStatus(200)
    assert.equal(res.body().user.role, 'ong')
    assert.exists(res.body().token)
  })
})
