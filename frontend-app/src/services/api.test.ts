import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import apiService from './api'

// ---------------------------------------------------------------------------
// Helper: simula una respuesta de fetch
// ---------------------------------------------------------------------------

const mockFetch = (ok: boolean, body: any, status = ok ? 200 : 400) => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
  } as Response)
}

// ---------------------------------------------------------------------------

describe('ApiService — inyección de token', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })
  afterEach(() => vi.restoreAllMocks())

  it('incluye Authorization Bearer cuando hay token en localStorage', async () => {
    localStorage.setItem('token', 'mi-jwt')
    mockFetch(true, { success: true })

    await apiService.request('/test')

    const [, options] = (fetch as any).mock.calls[0]
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer mi-jwt')
  })

  it('no incluye Authorization cuando no hay token', async () => {
    mockFetch(true, { success: true })

    await apiService.request('/test')

    const [, options] = (fetch as any).mock.calls[0]
    expect((options.headers as Record<string, string>)['Authorization']).toBeUndefined()
  })

  it('incluye Content-Type: application/json en todos los requests', async () => {
    mockFetch(true, { success: true })
    await apiService.request('/test')
    const [, options] = (fetch as any).mock.calls[0]
    expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json')
  })

  it('construye la URL añadiendo el endpoint a la base', async () => {
    mockFetch(true, { success: true })
    await apiService.request('/mi-endpoint')
    const [url] = (fetch as any).mock.calls[0]
    expect(url).toMatch(/\/mi-endpoint$/)
  })
})

// ---------------------------------------------------------------------------

describe('ApiService — manejo de respuestas', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })
  afterEach(() => vi.restoreAllMocks())

  it('retorna los datos de la respuesta cuando ok=true', async () => {
    const payload = { success: true, data: [1, 2, 3], pagination: { limit: 10, offset: 0, total: 3 } }
    mockFetch(true, payload)
    const result = await apiService.request('/data')
    expect(result).toEqual(payload)
  })

  it('lanza error con data.message cuando ok=false', async () => {
    mockFetch(false, { message: 'No autorizado' }, 401)
    await expect(apiService.request('/protected')).rejects.toThrow('No autorizado')
  })

  it('lanza error genérico con el status si data.message no existe', async () => {
    mockFetch(false, {}, 500)
    await expect(apiService.request('/error')).rejects.toThrow('HTTP error! status: 500')
  })

  it('re-lanza errores de red (fetch rechazado)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network failure'))
    await expect(apiService.request('/net')).rejects.toThrow('Network failure')
  })
})

// ---------------------------------------------------------------------------

describe('ApiService — productos', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })
  afterEach(() => vi.restoreAllMocks())

  it('getProducts sin params llama a /products sin query string', async () => {
    mockFetch(true, { success: true, data: [] })
    await apiService.getProducts()
    const [url] = (fetch as any).mock.calls[0]
    expect(url).toMatch(/\/products\?$/)
  })

  it('getProducts con status y limit los pasa como query params', async () => {
    mockFetch(true, { success: true, data: [] })
    await apiService.getProducts({ status: 'available', limit: 10, offset: 5 })
    const [url] = (fetch as any).mock.calls[0]
    expect(url).toContain('status=available')
    expect(url).toContain('limit=10')
    expect(url).toContain('offset=5')
  })

  it('createProduct hace POST con el cuerpo JSON correcto', async () => {
    mockFetch(true, { success: true })
    const data = { nombre: 'Leche', categoria: 'Lácteos', unidades: 5, vencimiento: '2026-01-01' }
    await apiService.createProduct(data)
    const [url, options] = (fetch as any).mock.calls[0]
    expect(url).toContain('/products')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toMatchObject(data)
  })

  it('updateProduct hace PUT a /products/:id con body', async () => {
    mockFetch(true, { success: true })
    await apiService.updateProduct('42', { nombre: 'Pan', unidades: 3 })
    const [url, options] = (fetch as any).mock.calls[0]
    expect(url).toContain('/products/42')
    expect(options.method).toBe('PUT')
    expect(JSON.parse(options.body)).toMatchObject({ nombre: 'Pan', unidades: 3 })
  })

  it('deleteProduct hace DELETE a /products/:id', async () => {
    mockFetch(true, { success: true })
    await apiService.deleteProduct('7')
    const [url, options] = (fetch as any).mock.calls[0]
    expect(url).toContain('/products/7')
    expect(options.method).toBe('DELETE')
  })

  it('getAvailableProducts llama a /products/available', async () => {
    mockFetch(true, { success: true, data: [] })
    await apiService.getAvailableProducts()
    const [url] = (fetch as any).mock.calls[0]
    expect(url).toContain('/products/available')
  })
})

// ---------------------------------------------------------------------------

describe('ApiService — donaciones', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })
  afterEach(() => vi.restoreAllMocks())

  it('getDonations con ong_id y status los pasa como query params', async () => {
    mockFetch(true, { success: true, data: [] })
    await apiService.getDonations({ ong_id: 'ong-123', status: 'requested', limit: 20 })
    const [url] = (fetch as any).mock.calls[0]
    expect(url).toContain('ong_id=ong-123')
    expect(url).toContain('status=requested')
    expect(url).toContain('limit=20')
  })

  it('createDonation hace POST con product_id y quantity', async () => {
    mockFetch(true, { success: true })
    await apiService.createDonation({ product_id: 'p1', quantity: 10 })
    const [url, options] = (fetch as any).mock.calls[0]
    expect(url).toContain('/donations')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toMatchObject({ product_id: 'p1', quantity: 10 })
  })

  it('requestDonation hace POST a /donations/:id/request con quantity', async () => {
    mockFetch(true, { success: true })
    await apiService.requestDonation('55', 4)
    const [url, options] = (fetch as any).mock.calls[0]
    expect(url).toContain('/donations/55/request')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toMatchObject({ quantity: 4 })
  })

  it('confirmDonation hace POST a /donations/:id/confirm', async () => {
    mockFetch(true, { success: true })
    await apiService.confirmDonation('9')
    const [url, options] = (fetch as any).mock.calls[0]
    expect(url).toContain('/donations/9/confirm')
    expect(options.method).toBe('POST')
  })

  it('getAvailableDonations llama a /donations/available', async () => {
    mockFetch(true, { success: true, data: [] })
    await apiService.getAvailableDonations()
    const [url] = (fetch as any).mock.calls[0]
    expect(url).toContain('/donations/available')
  })

  it('getDonationStats construye query params con user_id y ong_id', async () => {
    mockFetch(true, { success: true })
    await apiService.getDonationStats({ user_id: 'u1', ong_id: 'o2' })
    const [url] = (fetch as any).mock.calls[0]
    expect(url).toContain('user_id=u1')
    expect(url).toContain('ong_id=o2')
  })
})

// ---------------------------------------------------------------------------

describe('ApiService — autenticación', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })
  afterEach(() => vi.restoreAllMocks())

  it('login hace POST a /auth/login con email y password', async () => {
    mockFetch(true, { success: true, token: 'jwt-tok' })
    await apiService.login('a@b.com', 'secreto')
    const [url, options] = (fetch as any).mock.calls[0]
    expect(url).toContain('/auth/login')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toMatchObject({ email: 'a@b.com', password: 'secreto' })
  })

  it('register hace POST a /auth/register con todos los campos', async () => {
    mockFetch(true, { success: true })
    const data = {
      email: 'x@x.com',
      password: 'Pass1',
      business_name: 'Biz',
      phone: '3001234567',
      nit: '900123456',
      role: 'supermarket' as const,
    }
    await apiService.register(data)
    const [url, options] = (fetch as any).mock.calls[0]
    expect(url).toContain('/auth/register')
    expect(JSON.parse(options.body)).toMatchObject(data)
  })

  it('logout hace POST a /auth/logout', async () => {
    mockFetch(true, { success: true })
    await apiService.logout()
    const [url, options] = (fetch as any).mock.calls[0]
    expect(url).toContain('/auth/logout')
    expect(options.method).toBe('POST')
  })
})

// ---------------------------------------------------------------------------

describe('ApiService — notificaciones', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })
  afterEach(() => vi.restoreAllMocks())

  it('getNotifications con limit agrega el query param', async () => {
    mockFetch(true, { success: true, data: [] })
    await apiService.getNotifications({ limit: 20, offset: 10 })
    const [url] = (fetch as any).mock.calls[0]
    expect(url).toContain('limit=20')
    expect(url).toContain('offset=10')
  })

  it('markNotificationAsRead hace POST a /notifications/:id/read', async () => {
    mockFetch(true, { success: true })
    await apiService.markNotificationAsRead('3')
    const [url, options] = (fetch as any).mock.calls[0]
    expect(url).toContain('/notifications/3/read')
    expect(options.method).toBe('POST')
  })

  it('markAllNotificationsAsRead hace POST a /notifications/mark-all-read', async () => {
    mockFetch(true, { success: true })
    await apiService.markAllNotificationsAsRead()
    const [url, options] = (fetch as any).mock.calls[0]
    expect(url).toContain('/notifications/mark-all-read')
    expect(options.method).toBe('POST')
  })

  it('clearAllNotifications hace POST a /notifications/clear-all', async () => {
    mockFetch(true, { success: true })
    await apiService.clearAllNotifications()
    const [url, options] = (fetch as any).mock.calls[0]
    expect(url).toContain('/notifications/clear-all')
    expect(options.method).toBe('POST')
  })
})
