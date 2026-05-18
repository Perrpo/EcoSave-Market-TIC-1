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
      const { quantity } = request.only(['quantity'])
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
        id,
        quantity ? Number(quantity) : undefined
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
  /**
   * Genera y descarga el certificado de donación (Ley 2380/2024)
   * GET /api/v1/donations/:id/certificate
   */
  async downloadCertificate({ params, response }: HttpContext) {
    try {
      // Importación dinámica
      const certificateGeneratorService = (await import('#services/certificate_generator_service')).default
      
      const { id } = params
      const pdfBuffer = await certificateGeneratorService.generateCertificate(id)

      response.header('Content-Type', 'application/pdf')
      response.header('Content-Disposition', `attachment; filename="certificado-donacion-${id.slice(0, 8)}.pdf"`)
      
      return response.send(pdfBuffer)
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al generar el certificado',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Genera y descarga el certificado consolidado anual
   * GET /api/v1/donations/certificate/all
   */
  async downloadConsolidatedCertificate({ request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)
      
      if (!userId) {
        return response.unauthorized({ success: false, message: 'Token inválido o ausente' })
      }

      const role = request.qs().role || 'supermarket'

      const certificateGeneratorService = (await import('#services/certificate_generator_service')).default
      const pdfBuffer = await certificateGeneratorService.generateConsolidatedCertificate(accessToken, userId, role)

      response.header('Content-Type', 'application/pdf')
      response.header('Content-Disposition', `attachment; filename="reporte-consolidado-${role}.pdf"`)
      
      return response.send(pdfBuffer)
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al generar el certificado consolidado',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Envía el certificado consolidado anual por correo electrónico
   * POST /api/v1/donations/certificate/send-email
   */
  async sendConsolidatedCertificateEmail({ request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)
      
      if (!userId) {
        return response.unauthorized({ success: false, message: 'Token inválido o ausente' })
      }

      const { email, role } = request.only(['email', 'role'])
      
      if (!email) {
        return response.badRequest({ success: false, message: 'El correo electrónico es requerido' })
      }

      const userRole = role || 'supermarket'

      const certificateGeneratorService = (await import('#services/certificate_generator_service')).default
      const emailService = (await import('#services/email_service')).default
      
      const pdfBuffer = await certificateGeneratorService.generateConsolidatedCertificate(accessToken, userId, userRole)
      const result = await emailService.sendCertificateEmail(email, pdfBuffer, userRole)

      if (result.success) {
        return response.ok({ success: true, message: 'Certificado enviado exitosamente al correo' })
      } else {
        return response.badRequest({ success: false, message: 'No se pudo enviar el correo: ' + result.error })
      }
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al enviar el certificado consolidado por correo',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }
}
