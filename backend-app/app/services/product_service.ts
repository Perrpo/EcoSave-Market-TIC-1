import ProductRepository from '#repositories/product_repository'
import supabaseService from '#services/supabase_service'

export default class ProductService {
  private getRepository(accessToken?: string, privileged = false) {
    const client = supabaseService.getClient(accessToken, privileged)
    return new ProductRepository(client)
  }

  async getProductsForUser(accessToken: string | undefined, userId: string, limit: number, offset: number, status?: string) {
    const repository = this.getRepository(accessToken, true)
    return await repository.findAllByUserId(userId, limit, offset, status)
  }

  async createProduct(accessToken: string | undefined, userId: string, productData: any) {
    const repository = this.getRepository(accessToken, true)

    if (!productData.estado) {
      const today = new Date()
      const expiryDate = new Date(productData.vencimiento)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      let estado = 'Normal'

      if (daysUntilExpiry < 0) {
        estado = 'Vencido'
      } else if (daysUntilExpiry <= 2) {
        estado = 'Urgente'
      } else if (daysUntilExpiry <= 5) {
        estado = 'Advertencia'
      }

      productData.estado = estado
    }

    return await repository.create({
      user_id: userId,
      nombre: productData.nombre,
      categoria: productData.categoria,
      unidades: productData.unidades,
      vencimiento: productData.vencimiento,
      estado: productData.estado,
    })
  }

  async getProductById(accessToken: string | undefined, id: string) {
    const repository = this.getRepository(accessToken, true)
    return await repository.findById(id)
  }

  async updateProduct(accessToken: string | undefined, id: string, updateData: any) {
    const repository = this.getRepository(accessToken, true)
    return await repository.update(id, updateData)
  }

  async deleteProduct(accessToken: string | undefined, id: string) {
    const repository = this.getRepository(accessToken, true)
    return await repository.delete(id)
  }

  async getAvailableProducts(accessToken: string | undefined) {
    // Must use privileged client to bypass broken RLS on profiles
    const repository = this.getRepository(accessToken, true)
    return await repository.findAvailable()
  }
}
