import type { HttpContext } from '@adonisjs/core/http'
import supabaseService from '#services/supabase_service'

export default class DonationController {
  /**
   * Lista donaciones del usuario autenticado (supermercado) o de una ONG (asignadas)
   * GET /api/v1/donations
   */
  async index({ request, response }: HttpContext) {
    try {
      const { status, limit = 50, offset = 0, ong_id } = request.qs()

      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)

      if (!userId) {
        return response.unauthorized({
          success: false,
          message: 'Token inválido o ausente',
        })
      }

      const supabase = supabaseService.getClient(accessToken, true)

      let query = supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1)

      // Si viene ong_id lo usamos para el dashboard ONG; de lo contrario usamos el user_id (supermercado)
      if (ong_id) {
        query = query.eq('ong_id', ong_id)
      } else {
        query = query.eq('user_id', userId)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data: donations, error } = await query

      if (error) {
        console.error('Supabase donations error', error)
      }

      if (error) {
        return response.badRequest({
          success: false,
          message: 'Error al obtener donaciones',
          error: error.message,
        })
      }

      return response.ok({
        success: true,
        data: donations || [],
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: donations?.length || 0,
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al listar donaciones',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Crea una nueva donación (supermercado dona un producto)
   * POST /api/v1/donations
   */
  async store({ request, response }: HttpContext) {
    try {
      const donationData = request.only([
        'product_id',
        'quantity',
        'status'
      ])

      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)

      if (!userId) {
        return response.unauthorized({
          success: false,
          message: 'Token inválido o ausente',
        })
      }

      const supabase = supabaseService.getClient(accessToken, true)

      // Obtener información del producto (RLS valida propiedad)
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', donationData.product_id)
        .single()

      if (productError || !product) {
        return response.badRequest({
          success: false,
          message: 'Producto no encontrado',
        })
      }

      // Crear la donación
      const { data: donation, error } = await supabase
        .from('donations')
        .insert({
          product_id: donationData.product_id,
          user_id: userId,
          quantity: donationData.quantity,
          product_name: product.nombre,
          product_category: product.categoria,
          expiry_date: product.vencimiento,
          status: donationData.status || 'available',
        })
        .select()
        .single()

      if (error) {
        return response.badRequest({
          success: false,
          message: 'Error al crear donación',
          error: error.message,
        })
      }

      // Marcar el producto como donado (actualizar estado)
      await supabase
        .from('products')
        .update({
          estado: 'Donado',
          updated_at: new Date().toISOString()
        })
        .eq('id', donationData.product_id)

      return response.created({
        success: true,
        message: 'Donación creada exitosamente',
        data: donation,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al crear donación',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * ONG solicita una donación
   * POST /api/v1/donations/:id/request
   */
  async request({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const ongId = await supabaseService.getUserId(accessToken)

      if (!ongId) {
        return response.unauthorized({
          success: false,
          message: 'Token inválido o ausente',
        })
      }

      const supabase = supabaseService.getClient(accessToken, true)

      // Verificar que la donación existe y está disponible
      const { data: donation, error: donationError } = await supabase
        .from('donations')
        .select('*')
        .eq('id', id)
        .single()

      if (donationError || !donation) {
        return response.notFound({
          success: false,
          message: 'Donación no encontrada',
        })
      }

      if (donation.status !== 'available') {
        return response.badRequest({
          success: false,
          message: 'Esta donación ya no está disponible',
        })
      }

      // Actualizar la donación
      const { data: updatedDonation, error } = await supabase
        .from('donations')
        .update({
          ong_id: ongId,
          status: 'requested',
          requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return response.badRequest({
          success: false,
          message: 'Error al solicitar donación',
          error: error.message,
        })
      }

      return response.ok({
        success: true,
        message: 'Donación solicitada exitosamente',
        data: updatedDonation,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al solicitar donación',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * ONG confirma recepción de la donación
   * POST /api/v1/donations/:id/confirm
   */
  async confirm({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)

      if (!userId) {
        return response.unauthorized({
          success: false,
          message: 'Token inválido o ausente',
        })
      }

      const supabase = supabaseService.getClient(accessToken, true)

      // Verificar que la donación existe y está solicitada
      const { data: donation, error: donationError } = await supabase
        .from('donations')
        .select('*')
        .eq('id', id)
        .single()

      if (donationError || !donation) {
        return response.notFound({
          success: false,
          message: 'Donación no encontrada',
        })
      }

      if (donation.status !== 'requested') {
        return response.badRequest({
          success: false,
          message: 'Esta donación no puede ser confirmada',
        })
      }

      // Actualizar la donación
      const { data: updatedDonation, error } = await supabase
        .from('donations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return response.badRequest({
          success: false,
          message: 'Error al confirmar donación',
          error: error.message,
        })
      }

      return response.ok({
        success: true,
        message: 'Donación confirmada exitosamente',
        data: updatedDonation,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al confirmar donación',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Obtiene donaciones disponibles para ONGs
   * GET /api/v1/donations/available
   */
  async getAvailable({ request, response }: HttpContext) {
    try {
      // Usamos cliente privilegiado para evitar RLS recursivas en policies de profiles
      const supabase = supabaseService.getClient(undefined, true)

      const { data: donations, error } = await supabase
        .from('donations')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })

      if (error) {
        return response.badRequest({
          success: false,
          message: 'Error al obtener donaciones disponibles',
          error: error.message,
        })
      }

      return response.ok({
        success: true,
        data: donations || [],
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al obtener donaciones disponibles',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Obtiene estadísticas de donaciones
   * GET /api/v1/donations/stats
   */
  async getStats({ request, response }: HttpContext) {
    try {
      const { ong_id } = request.qs()
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)

      if (!userId) {
        return response.unauthorized({
          success: false,
          message: 'Token inválido o ausente',
        })
      }

      const supabase = supabaseService.getClient(accessToken)

      let baseQuery = supabase.from('donations').select('*')

      if (ong_id) {
        baseQuery = baseQuery.eq('ong_id', ong_id)
      } else {
        baseQuery = baseQuery.eq('user_id', userId)
      }

      const { data: donations, error } = await baseQuery

      if (error) {
        return response.badRequest({
          success: false,
          message: 'Error al obtener estadísticas',
          error: error.message,
        })
      }

      const stats = {
        total: donations?.length || 0,
        available: donations?.filter(d => d.status === 'available').length || 0,
        requested: donations?.filter(d => d.status === 'requested').length || 0,
        completed: donations?.filter(d => d.status === 'completed').length || 0,
        totalItems: donations?.reduce((sum, d) => sum + (d.quantity || 0), 0) || 0,
      }

      return response.ok({
        success: true,
        data: stats,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }
}
