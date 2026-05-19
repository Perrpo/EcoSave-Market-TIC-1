import { test } from '@japa/runner'
import DonationService from '#services/donation_service'

const makeDonation = (overrides: Record<string, any> = {}) => ({
  id: 'don-1',
  product_id: 'prod-1',
  user_id: 'super-1',
  quantity: 10,
  product_name: 'Leche',
  product_category: 'Lácteos',
  expiry_date: new Date().toISOString(),
  status: 'available',
  ong_id: null,
  ...overrides,
})

const buildService = (donationData: any, productData?: any) => {
  const service = new DonationService()
  const fakeRepo = {
    findById: async () => ({
      data: donationData,
      error: donationData ? null : new Error('not found'),
    }),
    update: async (id: string, data: any) => ({
      data: { ...donationData, id, ...data },
      error: null,
    }),
    create: async (data: any) => ({ data, error: null }),
    findAll: async () => ({ data: [], error: null }),
    findAvailable: async () => ({ data: [], error: null }),
    getStats: async () => ({ data: [], error: null }),
  }
  const fakeProductRepo = {
    findById: async () => ({
      data: productData ?? null,
      error: productData ? null : new Error('not found'),
    }),
    update: async (id: string, data: any) => ({ data: { id, ...data }, error: null }),
    create: async (data: any) => ({ data, error: null }),
  }
  ;(service as any).getRepository = () => fakeRepo
  ;(service as any).getProductRepository = () => fakeProductRepo
  return service
}

// ---------------------------------------------------------------------------
// requestDonation
// ---------------------------------------------------------------------------

test.group('DonationService.requestDonation - validaciones de estado y cantidad', () => {
  test('retorna error cuando la donación no existe', async ({ assert }) => {
    const service = buildService(null)

    const result = await service.requestDonation(undefined, 'ong-1', 'don-inexistente')

    assert.isNotNull(result.error)
    assert.equal(result.error!.message, 'Donación no encontrada')
    assert.isNull(result.data)
  })

  test('retorna error cuando la donación ya fue solicitada (status: requested)', async ({
    assert,
  }) => {
    const service = buildService(makeDonation({ status: 'requested' }))

    const result = await service.requestDonation(undefined, 'ong-1', 'don-1')

    assert.isNotNull(result.error)
    assert.equal(result.error!.message, 'Esta donación ya no está disponible')
  })

  test('retorna error cuando la donación ya fue completada (status: completed)', async ({
    assert,
  }) => {
    const service = buildService(makeDonation({ status: 'completed' }))

    const result = await service.requestDonation(undefined, 'ong-1', 'don-1')

    assert.isNotNull(result.error)
    assert.equal(result.error!.message, 'Esta donación ya no está disponible')
  })

  test('retorna error cuando la cantidad solicitada es 0', async ({ assert }) => {
    const service = buildService(makeDonation({ quantity: 10 }))

    const result = await service.requestDonation(undefined, 'ong-1', 'don-1', 0)

    assert.isNotNull(result.error)
    assert.equal(result.error!.message, 'Cantidad solicitada inválida')
  })

  test('retorna error cuando la cantidad solicitada es negativa', async ({ assert }) => {
    const service = buildService(makeDonation({ quantity: 10 }))

    const result = await service.requestDonation(undefined, 'ong-1', 'don-1', -5)

    assert.isNotNull(result.error)
    assert.equal(result.error!.message, 'Cantidad solicitada inválida')
  })

  test('retorna error cuando la cantidad supera el stock disponible', async ({ assert }) => {
    const service = buildService(makeDonation({ quantity: 10 }))

    const result = await service.requestDonation(undefined, 'ong-1', 'don-1', 11)

    assert.isNotNull(result.error)
    assert.equal(result.error!.message, 'Cantidad solicitada inválida')
  })
})

// ---------------------------------------------------------------------------
// confirmDonation
// ---------------------------------------------------------------------------

test.group('DonationService.confirmDonation - validaciones de estado', () => {
  test('retorna error cuando la donación no existe', async ({ assert }) => {
    const service = buildService(null)

    const result = await service.confirmDonation(undefined, 'don-inexistente')

    assert.isNotNull(result.error)
    assert.equal(result.error!.message, 'Donación no encontrada')
    assert.isNull(result.data)
  })

  test('retorna error cuando la donación aún está disponible (status: available)', async ({
    assert,
  }) => {
    const service = buildService(makeDonation({ status: 'available' }))

    const result = await service.confirmDonation(undefined, 'don-1')

    assert.isNotNull(result.error)
    assert.equal(result.error!.message, 'Esta donación no puede ser confirmada')
  })

  test('retorna error cuando la donación ya fue completada (status: completed)', async ({
    assert,
  }) => {
    const service = buildService(makeDonation({ status: 'completed' }))

    const result = await service.confirmDonation(undefined, 'don-1')

    assert.isNotNull(result.error)
    assert.equal(result.error!.message, 'Esta donación no puede ser confirmada')
  })
})

// ---------------------------------------------------------------------------
// getDonationStats
// ---------------------------------------------------------------------------

test.group('DonationService.getDonationStats - agregación de totales', () => {
  test('calcula correctamente totales por estado e items', async ({ assert }) => {
    const donations = [
      { status: 'available', quantity: 5 },
      { status: 'available', quantity: 3 },
      { status: 'requested', quantity: 7 },
      { status: 'completed', quantity: 2 },
    ]
    const service = new DonationService()
    ;(service as any).getRepository = () => ({
      getStats: async () => ({ data: donations, error: null }),
    })

    const result = await service.getDonationStats(undefined)

    assert.isNull(result.error)
    assert.equal(result.data!.total, 4)
    assert.equal(result.data!.available, 2)
    assert.equal(result.data!.requested, 1)
    assert.equal(result.data!.completed, 1)
    assert.equal(result.data!.totalItems, 17)
  })

  test('retorna ceros cuando no hay donaciones registradas', async ({ assert }) => {
    const service = new DonationService()
    ;(service as any).getRepository = () => ({
      getStats: async () => ({ data: [], error: null }),
    })

    const result = await service.getDonationStats(undefined)

    assert.isNull(result.error)
    assert.equal(result.data!.total, 0)
    assert.equal(result.data!.available, 0)
    assert.equal(result.data!.requested, 0)
    assert.equal(result.data!.completed, 0)
    assert.equal(result.data!.totalItems, 0)
  })

  test('retorna error cuando el repositorio falla', async ({ assert }) => {
    const service = new DonationService()
    ;(service as any).getRepository = () => ({
      getStats: async () => ({ data: null, error: new Error('DB error') }),
    })

    const result = await service.getDonationStats(undefined)

    assert.isNotNull(result.error)
    assert.isNull(result.data)
  })
})
