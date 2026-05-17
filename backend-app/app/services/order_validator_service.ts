import OrderService from '#services/order_service'
import ProductService from '#services/product_service'

interface OrderProduct {
  product_id: string
  product_name: string
  quantity: number
  price: number
  subtotal: number
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Servicio para validación de órdenes.
 *
 * ARQUITECTURA POR CAPAS:
 * - Este servicio NO instancia repositorios directamente.
 * - Delega el acceso a datos a OrderService y ProductService.
 * - Regla: un servicio puede llamar a otro servicio del mismo nivel,
 *   pero nunca debe saltar capas accediendo al repositorio directamente.
 */
class OrderValidatorService {
  private orderService = new OrderService()
  private productService = new ProductService()

  /**
   * Valida una orden completa
   */
  async validateOrder(orderId: string): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Delegamos la búsqueda a OrderService — no usamos repositorio directamente
      const { data: order, error } = await this.orderService.getOrderById(undefined, orderId)

      if (error || !order) {
        errors.push('Orden no encontrada')
        return { isValid: false, errors, warnings }
      }

      // Validar datos del cliente
      if (!order.customer_name || order.customer_name.trim() === '') {
        errors.push('Nombre del cliente es requerido')
      }

      if (!order.customer_email || !this.isValidEmail(order.customer_email)) {
        errors.push('Email del cliente es inválido')
      }

      // Validar productos
      if (!order.products || order.products.length === 0) {
        errors.push('La orden debe tener al menos un producto')
      } else {
        for (const product of order.products) {
          if (product.quantity <= 0) {
            errors.push(`Cantidad inválida para producto ${product.product_name}`)
          }
          if (product.price <= 0) {
            errors.push(`Precio inválido para producto ${product.product_name}`)
          }
        }
      }

      // Validar total
      if (!order.total || order.total <= 0) {
        errors.push('Total de la orden debe ser mayor a 0')
      }

      // Validar cálculo del total
      const calculatedTotal = this.calculateTotal(order.products)
      if (Math.abs(calculatedTotal - order.total) > 0.01) {
        warnings.push(
          `El total calculado (${calculatedTotal}) no coincide con el total de la orden (${order.total})`
        )
      }

      // Validar stock de productos
      const stockValidation = await this.validateStock(order.products)
      if (!stockValidation.isValid) {
        errors.push(...stockValidation.errors)
      }
      warnings.push(...stockValidation.warnings)

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      }
    } catch (error) {
      console.error('Error validating order:', error)
      return {
        isValid: false,
        errors: ['Error al validar la orden'],
        warnings,
      }
    }
  }

  /**
   * Valida el stock de productos.
   * Usa ProductService — no instancia ProductRepository directamente.
   */
  private async validateStock(products: OrderProduct[]): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      for (const product of products) {
        const { data: productData, error } = await this.productService.getProductById(
          undefined,
          product.product_id
        )

        if (error || !productData) {
          errors.push(`Producto ${product.product_name} no encontrado`)
          continue
        }

        const stock = productData.unidades ?? 0

        if (stock < product.quantity) {
          errors.push(
            `Stock insuficiente para ${productData.nombre}. Disponible: ${stock}, Solicitado: ${product.quantity}`
          )
        } else if (stock < product.quantity * 1.5) {
          warnings.push(`Stock bajo para ${productData.nombre}`)
        }
      }

      return { isValid: errors.length === 0, errors, warnings }
    } catch (error) {
      console.error('Error validating stock:', error)
      return { isValid: false, errors: ['Error al validar stock'], warnings }
    }
  }

  private calculateTotal(products: OrderProduct[]): number {
    return products.reduce((sum, product) => sum + product.price * product.quantity, 0)
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  /**
   * Marca una orden como validada.
   * Usa OrderService — sin acceso directo al repositorio.
   */
  async markAsValidated(orderId: string): Promise<boolean> {
    try {
      const { error } = await this.orderService.updateOrderStatus(orderId, 'validated', {
        validated_at: new Date().toISOString(),
      })
      return !error
    } catch (error) {
      console.error('Error marking order as validated:', error)
      return false
    }
  }
}

export default new OrderValidatorService()
