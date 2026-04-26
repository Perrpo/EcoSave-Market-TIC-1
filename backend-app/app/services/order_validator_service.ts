import supabaseService from '#services/supabase_service'
import OrderRepository from '#repositories/order_repository'
import ProductRepository from '#repositories/product_repository'

/**
 * Interfaz para productos en órdenes
 */
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
 * Servicio para validación de órdenes
 */
class OrderValidatorService {
  /**
   * Valida una orden completa
   */
  async validateOrder(orderId: string): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const client = supabaseService.getClient(undefined, true)
      const orderRepository = new OrderRepository(client)
      
      // Obtener orden de Supabase
      const { data: order, error } = await orderRepository.findById(orderId)

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
        // Validar cada producto
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
        warnings.push(`El total calculado (${calculatedTotal}) no coincide con el total de la orden (${order.total})`)
      }

      // Validar stock de productos
      const stockValidation = await this.validateStock(order.products)
      if (!stockValidation.isValid) {
        errors.push(...stockValidation.errors)
      }

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
   * Valida el stock de productos
   */
  private async validateStock(products: OrderProduct[]): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const client = supabaseService.getClient(undefined, true)
      const productRepository = new ProductRepository(client)

      for (const product of products) {
        const { data: productData, error } = await productRepository.findById(product.product_id)

        if (error || !productData) {
          errors.push(`Producto ${product.product_name} no encontrado`)
          continue
        }

        if (productData.stock < product.quantity) {
          errors.push(
            `Stock insuficiente para ${productData.name}. Disponible: ${productData.stock}, Solicitado: ${product.quantity}`
          )
        } else if (productData.stock < product.quantity * 1.5) {
          warnings.push(`Stock bajo para ${productData.name}`)
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      }
    } catch (error) {
      console.error('Error validating stock:', error)
      return {
        isValid: false,
        errors: ['Error al validar stock'],
        warnings,
      }
    }
  }

  /**
   * Calcula el total de la orden
   */
  private calculateTotal(products: OrderProduct[]): number {
    return products.reduce((sum, product) => {
      return sum + product.price * product.quantity
    }, 0)
  }

  /**
   * Valida formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Marca una orden como validada
   */
  async markAsValidated(orderId: string): Promise<boolean> {
    try {
      const client = supabaseService.getClient(undefined, true)
      const orderRepository = new OrderRepository(client)
      
      const { error } = await orderRepository.update(orderId, { 
        status: 'validated',
        validated_at: new Date().toISOString()
      })

      return !error
    } catch (error) {
      console.error('Error marking order as validated:', error)
      return false
    }
  }
}

export default new OrderValidatorService()
