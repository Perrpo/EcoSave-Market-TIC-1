import orderValidatorService from '#services/order_validator_service'
import invoiceGeneratorService from '#services/invoice_generator_service'
import emailService from '#services/email_service'
import supabaseService from '#services/supabase_service'
import OrderRepository from '#repositories/order_repository'
import ProductRepository from '#repositories/product_repository'

interface ProcessingResult {
  success: boolean
  orderId: string
  message: string
  errors?: string[]
  warnings?: string[]
}

/**
 * Servicio principal para procesamiento automático de órdenes
 */
class OrderProcessorService {
  /**
   * Procesa una orden completa (validación, factura, email)
   */
  async processOrder(orderId: string): Promise<ProcessingResult> {
    try {
      console.log(`🔄 Processing order ${orderId}...`)

      // Paso 1: Validar la orden
      console.log('  ├─ Validating order...')
      const validation = await orderValidatorService.validateOrder(orderId)

      if (!validation.isValid) {
        return {
          success: false,
          orderId,
          message: 'Orden no válida',
          errors: validation.errors,
          warnings: validation.warnings,
        }
      }

      // Marcar como validada
      await orderValidatorService.markAsValidated(orderId)
      console.log('  ├─ ✅ Order validated')

      // Paso 2: Actualizar estado a "processing"
      await this.updateOrderStatus(orderId, 'processing')
      console.log('  ├─ Status updated to processing')

      // Paso 3: Generar factura
      console.log('  ├─ Generating invoice...')
      await invoiceGeneratorService.generateInvoice(orderId)
      console.log('  ├─ ✅ Invoice generated')

      // Paso 4: Enviar email de confirmación con factura
      console.log('  ├─ Sending confirmation email...')
      const emailSent = await emailService.sendOrderConfirmation(orderId)

      if (!emailSent) {
        console.log('  ├─ ⚠️  Email failed, but order processed')
      } else {
        console.log('  ├─ ✅ Email sent')
      }

      // Paso 5: Actualizar inventario
      await this.updateInventory(orderId)
      console.log('  ├─ ✅ Inventory updated')

      // Paso 6: Actualizar estado final
      await this.updateOrderStatus(orderId, 'completed')
      console.log('  └─ ✅ Order completed')

      return {
        success: true,
        orderId,
        message: 'Orden procesada exitosamente',
        warnings: validation.warnings,
      }
    } catch (error) {
      console.error('❌ Error processing order:', error)
      
      // Marcar orden como fallida
      await this.updateOrderStatus(orderId, 'pending')

      return {
        success: false,
        orderId,
        message: 'Error al procesar la orden',
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
      }
    }
  }

  /**
   * Procesa múltiples órdenes pendientes
   */
  async processPendingOrders(): Promise<ProcessingResult[]> {
    try {
      const client = supabaseService.getClient(undefined, true)
      const orderRepository = new OrderRepository(client)
      
      // Obtener órdenes pendientes
      const { data: orders, error } = await orderRepository.findAll(10, 0, 'pending')

      if (error || !orders || orders.length === 0) {
        console.log('📭 No pending orders to process')
        return []
      }

      console.log(`📦 Processing ${orders.length} pending orders...`)

      const results: ProcessingResult[] = []

      for (const order of orders) {
        const result = await this.processOrder(order.id)
        results.push(result)
        
        // Pequeña pausa entre órdenes para no sobrecargar
        await this.sleep(1000)
      }

      const successful = results.filter((r) => r.success).length
      console.log(`✅ Processed ${successful}/${orders.length} orders successfully`)

      return results
    } catch (error) {
      console.error('Error processing pending orders:', error)
      return []
    }
  }

  /**
   * Actualiza el estado de una orden
   */
  private async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      const client = supabaseService.getClient(undefined, true)
      const orderRepository = new OrderRepository(client)
      
      await orderRepository.update(orderId, { 
        status,
        updated_at: new Date().toISOString()
      })

      // Enviar notificación de cambio de estado
      if (status !== 'pending' && status !== 'processing') {
        await emailService.sendStatusUpdate(orderId, status)
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  /**
   * Actualiza el inventario después de procesar una orden
   */
  private async updateInventory(orderId: string): Promise<void> {
    try {
      const client = supabaseService.getClient(undefined, true)
      const orderRepository = new OrderRepository(client)
      const productRepository = new ProductRepository(client)
      
      // Obtener productos de la orden
      const { data: order, error } = await orderRepository.findById(orderId)

      if (error || !order || !order.products) return

      // Actualizar stock de cada producto
      for (const product of order.products) {
        const { data: currentProduct } = await productRepository.findById(product.product_id)

        if (currentProduct && currentProduct.stock !== undefined) {
          const newStock = currentProduct.stock - product.quantity

          await productRepository.update(product.product_id, { stock: Math.max(0, newStock) })
        }
      }
    } catch (error) {
      console.error('Error updating inventory:', error)
    }
  }

  /**
   * Reintenta procesar una orden fallida
   */
  async retryOrder(orderId: string): Promise<ProcessingResult> {
    console.log(`🔄 Retrying order ${orderId}...`)
    return await this.processOrder(orderId)
  }

  /**
   * Cancela una orden
   */
  async cancelOrder(orderId: string, reason?: string): Promise<boolean> {
    try {
      const client = supabaseService.getClient(undefined, true)
      const orderRepository = new OrderRepository(client)
      
      await orderRepository.update(orderId, { 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || 'No especificado'
      })

      // Enviar notificación
      await emailService.sendStatusUpdate(orderId, 'cancelled')

      console.log(`❌ Order ${orderId} cancelled`)
      return true
    } catch (error) {
      console.error('Error cancelling order:', error)
      return false
    }
  }

  /**
   * Obtiene estadísticas de procesamiento
   */
  async getProcessingStats(): Promise<any> {
    try {
      const client = supabaseService.getClient(undefined, true)
      const orderRepository = new OrderRepository(client)
      
      const { data: stats } = await orderRepository.findAll(1000, 0)

      if (!stats) return null

      const statusCount = stats.reduce((acc: any, order: any) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {})

      return {
        total: stats.length,
        by_status: statusCount,
        pending: statusCount.pending || 0,
        processing: statusCount.processing || 0,
        completed: statusCount.completed || 0,
        cancelled: statusCount.cancelled || 0,
      }
    } catch (error) {
      console.error('Error getting stats:', error)
      return null
    }
  }

  /**
   * Utilidad para pausar ejecución
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export default new OrderProcessorService()
