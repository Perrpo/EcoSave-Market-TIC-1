import type { HttpContext } from '@adonisjs/core/http'
import supabaseService from '#services/supabase_service'
import DonationService from '#services/donation_service'

export default class DonationController {
  private donationService: DonationService

  constructor() {
    this.donationService = new DonationService()
  }

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

      const { data: donations, error } = await this.donationService.getDonations(
        accessToken,
        Number(limit),
        Number(offset),
        ong_id as string | undefined,
        ong_id ? undefined : userId,
        status as string | undefined
      )

      if (error) {
        console.error('Supabase donations error', error)
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

      const { data: donation, error } = await this.donationService.createDonation(
        accessToken,
        userId,
        donationData
      )

      if (error) {
        return response.badRequest({
          success: false,
          message: error.message || 'Error al crear donación',
          error: error.message,
        })
      }

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
   * Obtiene una donación específica por ID
   * GET /api/v1/donations/:id
   */
  async show({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))

      const { data: donation, error } = await this.donationService.getDonationById(accessToken, id)

      if (error || !donation) {
        return response.notFound({
          success: false,
          message: 'Donación no encontrada',
        })
      }

      return response.ok({
        success: true,
        data: donation,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al obtener la donación',
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

      const { data: updatedDonation, error } = await this.donationService.requestDonation(
        accessToken,
        ongId,
        id
      )

      if (error) {
        return response.badRequest({
          success: false,
          message: error.message || 'Error al solicitar donación',
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

      const { data: updatedDonation, error } = await this.donationService.confirmDonation(
        accessToken,
        id
      )

      if (error) {
        return response.badRequest({
          success: false,
          message: error.message || 'Error al confirmar donación',
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
  async getAvailable({ response }: HttpContext) {
    try {
      const { data: donations, error } = await this.donationService.getAvailableDonations()

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

      const { data: stats, error } = await this.donationService.getDonationStats(
        accessToken,
        ong_id as string | undefined,
        ong_id ? undefined : userId
      )

      if (error) {
        return response.badRequest({
          success: false,
          message: 'Error al obtener estadísticas',
          error: error.message,
        })
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
