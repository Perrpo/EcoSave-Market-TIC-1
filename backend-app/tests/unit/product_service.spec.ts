import { test } from '@japa/runner'
import ProductService from '#services/product_service'

const futureDate = (daysFromNow: number) => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString()
}

const buildService = () => {
  const service = new ProductService()
  ;(service as any).getRepository = () => ({
    create: async (data: any) => ({ data, error: null }),
    findById: async (id: string) => ({ data: { id, nombre: 'Test', unidades: 10 }, error: null }),
    update: async (id: string, data: any) => ({ data: { id, ...data }, error: null }),
    delete: async () => ({ data: {}, error: null }),
    findAllByUserId: async () => ({ data: [], error: null }),
    findAvailable: async () => ({ data: [], error: null }),
  })
  return service
}

test.group('ProductService.createProduct - cálculo automático de estado', () => {
  test('asigna Normal para producto que vence en 10 días', async ({ assert }) => {
    const service = buildService()

    const result = await service.createProduct(undefined, 'user-1', {
      nombre: 'Leche',
      categoria: 'Lácteos',
      unidades: 10,
      vencimiento: futureDate(10),
    })

    assert.equal(result.data?.estado, 'Normal')
  })

  test('asigna Normal para producto que vence en exactamente 6 días', async ({ assert }) => {
    const service = buildService()

    const result = await service.createProduct(undefined, 'user-1', {
      nombre: 'Leche',
      categoria: 'Lácteos',
      unidades: 10,
      vencimiento: futureDate(6),
    })

    assert.equal(result.data?.estado, 'Normal')
  })

  test('asigna Advertencia para producto que vence en 5 días', async ({ assert }) => {
    const service = buildService()

    const result = await service.createProduct(undefined, 'user-1', {
      nombre: 'Yogur',
      categoria: 'Lácteos',
      unidades: 5,
      vencimiento: futureDate(5),
    })

    assert.equal(result.data?.estado, 'Advertencia')
  })

  test('asigna Advertencia para producto que vence en 3 días', async ({ assert }) => {
    const service = buildService()

    const result = await service.createProduct(undefined, 'user-1', {
      nombre: 'Queso',
      categoria: 'Lácteos',
      unidades: 2,
      vencimiento: futureDate(3),
    })

    assert.equal(result.data?.estado, 'Advertencia')
  })

  test('asigna Urgente para producto que vence en 2 días', async ({ assert }) => {
    const service = buildService()

    const result = await service.createProduct(undefined, 'user-1', {
      nombre: 'Pan',
      categoria: 'Panadería',
      unidades: 3,
      vencimiento: futureDate(2),
    })

    assert.equal(result.data?.estado, 'Urgente')
  })

  test('asigna Urgente para producto que vence mañana', async ({ assert }) => {
    const service = buildService()

    const result = await service.createProduct(undefined, 'user-1', {
      nombre: 'Carne',
      categoria: 'Carnes',
      unidades: 1,
      vencimiento: futureDate(1),
    })

    assert.equal(result.data?.estado, 'Urgente')
  })

  test('asigna Vencido para producto con fecha de ayer', async ({ assert }) => {
    const service = buildService()

    const result = await service.createProduct(undefined, 'user-1', {
      nombre: 'Jamón',
      categoria: 'Carnes',
      unidades: 2,
      vencimiento: futureDate(-1),
    })

    assert.equal(result.data?.estado, 'Vencido')
  })

  test('asigna Vencido para producto con fecha hace 30 días', async ({ assert }) => {
    const service = buildService()

    const result = await service.createProduct(undefined, 'user-1', {
      nombre: 'Conserva',
      categoria: 'Enlatados',
      unidades: 1,
      vencimiento: futureDate(-30),
    })

    assert.equal(result.data?.estado, 'Vencido')
  })

  test('respeta el estado provisto si ya viene definido en los datos', async ({ assert }) => {
    const service = buildService()

    const result = await service.createProduct(undefined, 'user-1', {
      nombre: 'Donado',
      categoria: 'Varios',
      unidades: 5,
      vencimiento: futureDate(10),
      estado: 'Donado',
    })

    // Si estado viene definido, no debe sobrescribirse con la lógica de vencimiento
    assert.equal(result.data?.estado, 'Donado')
  })
})
