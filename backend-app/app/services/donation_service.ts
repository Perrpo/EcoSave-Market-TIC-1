import DonationRepository from '#repositories/donation_repository'
import ProductRepository from '#repositories/product_repository'
import supabaseService from '#services/supabase_service'

export default class DonationService {
  private getRepository(accessToken?: string, privileged = false) {
    const client = supabaseService.getClient(accessToken, privileged)
    return new DonationRepository(client)
  }

  private getProductRepository(accessToken?: string, privileged = false) {
    const client = supabaseService.getClient(accessToken, privileged)
    return new ProductRepository(client)
  }

  async getDonations(accessToken: string | undefined, limit: number, offset: number, ongId?: string, userId?: string, status?: string) {
    const repository = this.getRepository(accessToken, true)
    return await repository.findAll(limit, offset, ongId, userId, status)
  }

  async createDonation(accessToken: string | undefined, userId: string, donationData: any) {
    const repository = this.getRepository(accessToken, true)
    const productRepository = this.getProductRepository(accessToken, true)

    // Obtener información del producto (RLS valida propiedad si no fuera privilegiado, aquí privilegiado)
    const { data: product, error: productError } = await productRepository.findById(donationData.product_id)

    if (productError || !product) {
      return { error: new Error('Producto no encontrado'), data: null }
    }

    // Crear la donación
    const { data: donation, error } = await repository.create({
      product_id: donationData.product_id,
      user_id: userId,
      quantity: donationData.quantity,
      product_name: product.nombre,
      product_category: product.categoria,
      expiry_date: product.vencimiento,
      status: donationData.status || 'available',
    })

    if (error) {
      return { error, data: null }
    }

    // Marcar el producto como donado
    await productRepository.update(donationData.product_id, {
      estado: 'Donado'
    })

    return { error: null, data: donation }
  }

  async getDonationById(accessToken: string | undefined, id: string) {
    const repository = this.getRepository(accessToken, true)
    return await repository.findById(id)
  }

  async requestDonation(accessToken: string | undefined, ongId: string, donationId: string) {
    const repository = this.getRepository(accessToken, true)

    const { data: donation, error: donationError } = await repository.findById(donationId)

    if (donationError || !donation) {
      return { error: new Error('Donación no encontrada'), data: null }
    }

    if (donation.status !== 'available') {
      return { error: new Error('Esta donación ya no está disponible'), data: null }
    }

    return await repository.update(donationId, {
      ong_id: ongId,
      status: 'requested',
      requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  async confirmDonation(accessToken: string | undefined, donationId: string) {
    const repository = this.getRepository(accessToken, true)

    const { data: donation, error: donationError } = await repository.findById(donationId)

    if (donationError || !donation) {
      return { error: new Error('Donación no encontrada'), data: null }
    }

    if (donation.status !== 'requested') {
      return { error: new Error('Esta donación no puede ser confirmada'), data: null }
    }

    return await repository.update(donationId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  async getAvailableDonations(_accessToken?: string) {
    // Usamos cliente privilegiado para evitar RLS recursivas en policies de profiles
    const repository = this.getRepository(undefined, true)
    return await repository.findAvailable()
  }

  async getDonationStats(accessToken: string | undefined, ongId?: string, userId?: string) {
    const repository = this.getRepository(accessToken)
    const { data: donations, error } = await repository.getStats(ongId, userId)

    if (error) {
      return { error, data: null }
    }

    const stats = {
      total: donations?.length || 0,
      available: donations?.filter((d: any) => d.status === 'available').length || 0,
      requested: donations?.filter((d: any) => d.status === 'requested').length || 0,
      completed: donations?.filter((d: any) => d.status === 'completed').length || 0,
      totalItems: donations?.reduce((sum: number, d: any) => sum + (d.quantity || 0), 0) || 0,
    }

    return { error: null, data: stats }
  }
}
