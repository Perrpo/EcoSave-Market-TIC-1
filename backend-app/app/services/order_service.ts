import OrderRepository from '#repositories/order_repository'
import supabaseService from '#services/supabase_service'

export default class OrderService {
  private getRepository(accessToken?: string, privileged = false) {
    const client = supabaseService.getClient(accessToken, privileged)
    return new OrderRepository(client)
  }

  async getOrders(accessToken: string | undefined, limit: number, offset: number, status?: string) {
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
      status: 'pending'
    })
  }
}
