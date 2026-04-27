import OrderRepository from '#repositories/order_repository'
import supabaseService from '#services/supabase_service'

/**
 * Servicio de órdenes.
 *
 * ARQUITECTURA POR CAPAS:
 * - Actúa como intermediario entre los Controllers y el OrderRepository.
 * - Es el ÚNICO punto de acceso a datos de órdenes en toda la aplicación.
 * - Otros servicios (order_processor, order_validator, invoice_generator, email_service)
 *   deben usar este servicio en lugar de instanciar OrderRepository directamente.
 */
export default class OrderService {
  private getRepository(accessToken?: string, privileged = false) {
    const client = supabaseService.getClient(accessToken, privileged)
    return new OrderRepository(client)
  }

  async getOrders(
    accessToken: string | undefined,
    limit: number,
    offset: number,
    status?: string
  ) {
    const repository = this.getRepository(accessToken)
    return await repository.findAll(limit, offset, status)
  }

  async getOrderById(accessToken: string | undefined, id: string) {
    const repository = this.getRepository(accessToken)
    return await repository.findById(id)
  }

  async createOrder(accessToken: string | undefined, data: any) {
    const repository = this.getRepository(accessToken)
    return await repository.create({
      ...data,
      status: 'pending',
    })
  }

  /**
   * Actualiza el estado de una orden.
   * Centraliza todos los cambios de estado, incluyendo campos adicionales
   * como cancelled_at, cancellation_reason, etc.
   * Usa cliente privilegiado (service role) para poder modificar cualquier orden.
   */
  async updateOrderStatus(orderId: string, status: string, extraFields?: Record<string, any>) {
    // Las actualizaciones de estado son operaciones internas que requieren service role
    const repository = this.getRepository(undefined, true)
    return await repository.update(orderId, {
      status,
      updated_at: new Date().toISOString(),
      ...extraFields,
    })
  }
}
