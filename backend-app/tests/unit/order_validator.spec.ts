import { test } from '@japa/runner'
import validatorService from '#services/order_validator_service'

const makeOrder = (overrides: Record<string, any> = {}) => ({
  customer_name: 'Juan Pérez',
  customer_email: 'juan@example.com',
  products: [
    {
      product_id: 'prod-1',
      product_name: 'Leche',
      quantity: 2,
      price: 5000,
      subtotal: 10000,
    },
  ],
  total: 10000,
  ...overrides,
})

const makeProduct = (overrides: Record<string, any> = {}) => ({
  id: 'prod-1',
  nombre: 'Leche',
  unidades: 20,
  ...overrides,
})

test.group('OrderValidatorService.validateOrder', (group) => {
  let savedOrderService: any
  let savedProductService: any

  group.each.setup(() => {
    savedOrderService = (validatorService as any).orderService
    savedProductService = (validatorService as any).productService
  })

  group.each.teardown(() => {
    ;(validatorService as any).orderService = savedOrderService
    ;(validatorService as any).productService = savedProductService
  })

  const mockServices = (orderData: any, productData: any) => {
    ;(validatorService as any).orderService = {
      getOrderById: async () => ({
        data: orderData,
        error: orderData ? null : new Error('not found'),
      }),
      updateOrderStatus: async () => ({ data: {}, error: null }),
    }
    ;(validatorService as any).productService = {
      getProductById: async () => ({
        data: productData,
        error: productData ? null : new Error('not found'),
      }),
    }
  }

  test('retorna error cuando la orden no existe', async ({ assert }) => {
    mockServices(null, null)

    const result = await validatorService.validateOrder('id-inexistente')

    assert.isFalse(result.isValid)
    assert.include(result.errors, 'Orden no encontrada')
  })

  test('retorna error cuando el nombre del cliente está vacío', async ({ assert }) => {
    mockServices(makeOrder({ customer_name: '' }), makeProduct())

    const result = await validatorService.validateOrder('orden-1')

    assert.isFalse(result.isValid)
    assert.include(result.errors, 'Nombre del cliente es requerido')
  })

  test('retorna error cuando el nombre del cliente es solo espacios', async ({ assert }) => {
    mockServices(makeOrder({ customer_name: '   ' }), makeProduct())

    const result = await validatorService.validateOrder('orden-1')

    assert.isFalse(result.isValid)
    assert.include(result.errors, 'Nombre del cliente es requerido')
  })

  test('retorna error cuando el email no tiene arroba', async ({ assert }) => {
    mockServices(makeOrder({ customer_email: 'no-es-email' }), makeProduct())

    const result = await validatorService.validateOrder('orden-1')

    assert.isFalse(result.isValid)
    assert.include(result.errors, 'Email del cliente es inválido')
  })

  test('retorna error cuando el email no tiene dominio', async ({ assert }) => {
    mockServices(makeOrder({ customer_email: 'user@' }), makeProduct())

    const result = await validatorService.validateOrder('orden-1')

    assert.isFalse(result.isValid)
    assert.include(result.errors, 'Email del cliente es inválido')
  })

  test('retorna error cuando la lista de productos está vacía', async ({ assert }) => {
    mockServices(makeOrder({ products: [] }), makeProduct())

    const result = await validatorService.validateOrder('orden-1')

    assert.isFalse(result.isValid)
    assert.include(result.errors, 'La orden debe tener al menos un producto')
  })

  test('retorna error cuando un producto tiene cantidad 0', async ({ assert }) => {
    const products = [
      { product_id: 'prod-1', product_name: 'Leche', quantity: 0, price: 5000, subtotal: 0 },
    ]
    mockServices(makeOrder({ products, total: 10000 }), makeProduct())

    const result = await validatorService.validateOrder('orden-1')

    assert.isFalse(result.isValid)
    assert.isTrue(result.errors.some((e) => e.includes('Cantidad inválida')))
  })

  test('retorna error cuando un producto tiene cantidad negativa', async ({ assert }) => {
    const products = [
      { product_id: 'prod-1', product_name: 'Leche', quantity: -1, price: 5000, subtotal: -5000 },
    ]
    mockServices(makeOrder({ products, total: 10000 }), makeProduct())

    const result = await validatorService.validateOrder('orden-1')

    assert.isFalse(result.isValid)
    assert.isTrue(result.errors.some((e) => e.includes('Cantidad inválida')))
  })

  test('retorna error cuando un producto tiene precio 0', async ({ assert }) => {
    const products = [
      { product_id: 'prod-1', product_name: 'Leche', quantity: 2, price: 0, subtotal: 0 },
    ]
    mockServices(makeOrder({ products, total: 10000 }), makeProduct())

    const result = await validatorService.validateOrder('orden-1')

    assert.isFalse(result.isValid)
    assert.isTrue(result.errors.some((e) => e.includes('Precio inválido')))
  })

  test('retorna error cuando el total de la orden es 0', async ({ assert }) => {
    mockServices(makeOrder({ total: 0 }), makeProduct())

    const result = await validatorService.validateOrder('orden-1')

    assert.isFalse(result.isValid)
    assert.include(result.errors, 'Total de la orden debe ser mayor a 0')
  })

  test('retorna advertencia cuando el total declarado no coincide con el calculado', async ({
    assert,
  }) => {
    // calculado: 2 * 5000 = 10000, declarado: 99999
    mockServices(makeOrder({ total: 99999 }), makeProduct())

    const result = await validatorService.validateOrder('orden-1')

    assert.isTrue(result.warnings.some((w) => w.includes('no coincide')))
  })

  test('no genera advertencia cuando el total coincide exactamente', async ({ assert }) => {
    mockServices(makeOrder({ total: 10000 }), makeProduct())

    const result = await validatorService.validateOrder('orden-1')

    assert.isFalse(result.warnings.some((w) => w.includes('no coincide')))
  })

  test('retorna error por stock insuficiente', async ({ assert }) => {
    const products = [
      { product_id: 'prod-1', product_name: 'Leche', quantity: 15, price: 5000, subtotal: 75000 },
    ]
    // stock disponible: 5, cantidad pedida: 15
    mockServices(makeOrder({ products, total: 75000 }), makeProduct({ unidades: 5 }))

    const result = await validatorService.validateOrder('orden-1')

    assert.isFalse(result.isValid)
    assert.isTrue(result.errors.some((e) => e.includes('Stock insuficiente')))
  })

  test('retorna advertencia cuando el stock está bajo (menos de 1.5x la cantidad pedida)', async ({
    assert,
  }) => {
    const products = [
      { product_id: 'prod-1', product_name: 'Leche', quantity: 2, price: 5000, subtotal: 10000 },
    ]
    // stock: 2, pedido: 2 → 2 < 2*1.5=3 → stock bajo
    mockServices(makeOrder({ products, total: 10000 }), makeProduct({ unidades: 2 }))

    const result = await validatorService.validateOrder('orden-1')

    assert.isTrue(result.isValid)
    assert.isTrue(result.warnings.some((w) => w.includes('Stock bajo')))
  })

  test('retorna error cuando el producto no existe en inventario', async ({ assert }) => {
    ;(validatorService as any).orderService = {
      getOrderById: async () => ({ data: makeOrder(), error: null }),
      updateOrderStatus: async () => ({ data: {}, error: null }),
    }
    ;(validatorService as any).productService = {
      getProductById: async () => ({ data: null, error: new Error('not found') }),
    }

    const result = await validatorService.validateOrder('orden-1')

    assert.isFalse(result.isValid)
    assert.isTrue(result.errors.some((e) => e.includes('no encontrado')))
  })

  test('aprueba una orden completamente válida sin errores ni advertencias', async ({ assert }) => {
    mockServices(makeOrder(), makeProduct({ unidades: 50 }))

    const result = await validatorService.validateOrder('orden-1')

    assert.isTrue(result.isValid)
    assert.isEmpty(result.errors)
  })
})
