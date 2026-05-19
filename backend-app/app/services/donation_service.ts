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

  private async mapSupermarkets(donations: any[]) {
    if (!donations || donations.length === 0) return donations;
    const userIds = [...new Set(donations.map(d => d.user_id).filter(Boolean))];
    if (userIds.length === 0) return donations;

    const client = supabaseService.getClient(undefined, true);
    const { data: profiles } = await client.from('profiles').select('id, nombre, business, phone').in('id', userIds);
    if (!profiles) return donations;

    const profileMap = profiles.reduce((acc: any, p: any) => {
      acc[p.id] = { business_name: p.business || p.nombre, phone: p.phone };
      return acc;
    }, {});

    return donations.map(d => ({
      ...d,
      supermarkets: profileMap[d.user_id] || null
    }));
  }

  async getDonations(accessToken: string | undefined, limit: number, offset: number, ongId?: string, userId?: string, status?: string) {
    const repository = this.getRepository(accessToken, true)
    const result = await repository.findAll(limit, offset, ongId, userId, status)
    if (result.data) {
      result.data = await this.mapSupermarkets(result.data)
    }
    return result
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

  async requestDonation(accessToken: string | undefined, ongId: string, donationId: string, requestedQuantity?: number) {
    const repository = this.getRepository(accessToken, true)

    const { data: donation, error: donationError } = await repository.findById(donationId)

    if (donationError || !donation) {
      return { error: new Error('Donación no encontrada'), data: null }
    }

    if (donation.status !== 'available') {
      return { error: new Error('Esta donación ya no está disponible'), data: null }
    }

    const availableQty = donation.quantity;
    const requestQty = requestedQuantity !== undefined ? requestedQuantity : availableQty;

    if (requestQty <= 0 || requestQty > availableQty) {
      return { error: new Error('Cantidad solicitada inválida'), data: null }
    }

    let result;

    if (requestQty < availableQty) {
      const remainingQty = availableQty - requestQty;

      // Crear el remanente disponible (Redistribución)
      await repository.create({
        product_id: donation.product_id,
        user_id: donation.user_id,
        quantity: remainingQty,
        product_name: donation.product_name,
        product_category: donation.product_category,
        expiry_date: donation.expiry_date,
        status: 'available',
      })

      // Y actualizar la actual para que sea la solicitada
      result = await repository.update(donationId, {
        ong_id: ongId,
        status: 'requested',
        quantity: requestQty,
        requested_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } else {
      result = await repository.update(donationId, {
        ong_id: ongId,
        status: 'requested',
        requested_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    if (!result.error && result.data) {
      // Notificar al supermercado dueño del producto
      const { default: NotificationService } = await import('#services/notification_service')
      const notificationService = new NotificationService()
      
      const { data: ongProfile } = await supabaseService.getClient(undefined, true)
        .from('profiles')
        .select('business, nombre')
        .eq('id', ongId)
        .single()

      const ongName = ongProfile?.business || ongProfile?.nombre || 'Una ONG'

      await notificationService.createNotification({
        user_id: donation.user_id, // El supermercado
        type: 'donation_requested',
        title: 'Nueva solicitud de donación',
        message: `${ongName} ha solicitado ${requestQty} unidades de ${donation.product_name}.`,
        product_id: donation.product_id
      }, true)
    }

    return result
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

    const result = await repository.update(donationId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (!result.error && result.data) {
      // Notificar al supermercado que la ONG ya recibió los productos
      const { default: NotificationService } = await import('#services/notification_service')
      const notificationService = new NotificationService()
      
      const { data: ongProfile } = await supabaseService.getClient(undefined, true)
        .from('profiles')
        .select('business, nombre')
        .eq('id', donation.ong_id)
        .single()

      const ongName = ongProfile?.business || ongProfile?.nombre || 'La ONG'

      await notificationService.createNotification({
        user_id: donation.user_id, // El supermercado
        type: 'donation_completed',
        title: 'Donación entregada',
        message: `${ongName} ha confirmado la recepción de ${donation.product_name}. ¡Gracias por tu aporte!`,
        product_id: donation.product_id
      }, true)
    }

    return result
  }

  async getAvailableDonations(_accessToken?: string) {
    // Usamos cliente privilegiado para evitar RLS recursivas en policies de profiles
    const repository = this.getRepository(undefined, true)
    const result = await repository.findAvailable()
    if (result.data) {
      result.data = await this.mapSupermarkets(result.data)
    }
    return result
  }

  async getDonationStats(accessToken: string | undefined, ongId?: string, userId?: string) {
    const repository = this.getRepository(accessToken, true)
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
