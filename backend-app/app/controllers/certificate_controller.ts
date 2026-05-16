import type { HttpContext } from '@adonisjs/core/http'
import supabaseService from '#services/supabase_service'
import certificateGeneratorService from '#services/certificate_generator_service'

export default class CertificateController {
  /**
   * Repositorio de certificados con búsqueda por múltiples criterios
   * GET /api/v1/certificates
   * Query params: codigo_certificado, donante_id, donatario_id, fecha_desde,
   *               fecha_hasta, estado, producto, limit, offset
   */
  async index({ request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)

      if (!userId) {
        return response.unauthorized({ success: false, message: 'Token inválido o ausente' })
      }

      const {
        codigo_certificado,
        fecha_desde,
        fecha_hasta,
        estado,
        producto,
        limit = 20,
        offset = 0,
      } = request.qs()

      // El supermercado ve sólo sus certificados; un admin/ONG ve todos los que le corresponden
      const supabase = supabaseService.getClient(accessToken, true)
      const { data: userRow } = await supabase
        .from('users')
        .select('role_id, roles(name)')
        .eq('id', userId)
        .single()

      const roleName: string = (userRow as any)?.roles?.name ?? 'supermarket'

      const filters: Record<string, unknown> = {
        codigo_certificado,
        fecha_desde,
        fecha_hasta,
        estado,
        producto,
        limit: Number(limit),
        offset: Number(offset),
      }

      // Limitar por rol: supermercado solo ve sus propios certificados como donante
      if (roleName === 'supermarket') {
        filters.donante_id = userId
      } else if (roleName === 'ong') {
        filters.donatario_id = userId
      }
      // admin ve todos (sin filtro extra de usuario)

      const result = await certificateGeneratorService.searchCertificates(
        filters as Parameters<typeof certificateGeneratorService.searchCertificates>[0]
      )

      return response.ok({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          limit: Number(limit),
          offset: Number(offset),
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al obtener certificados',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Detalle de un certificado
   * GET /api/v1/certificates/:id
   */
  async show({ params, request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)

      if (!userId) {
        return response.unauthorized({ success: false, message: 'Token inválido o ausente' })
      }

      const supabase = supabaseService.getClient(undefined, true)
      const { data: cert, error } = await supabase
        .from('donation_certificates')
        .select(`
          *,
          donor:users!donation_certificates_donante_id_fkey (
            email,
            profile:user_profiles!fk_user_profiles_user (name, business, phone, address)
          ),
          recipient:users!donation_certificates_donatario_id_fkey (
            email,
            profile:user_profiles!fk_user_profiles_user (name, business, phone, address)
          )
        `)
        .eq('id', params.id)
        .single()

      if (error || !cert) {
        return response.notFound({ success: false, message: 'Certificado no encontrado' })
      }

      return response.ok({ success: true, data: cert })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al obtener certificado',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Genera un certificado a partir de una donación completada
   * POST /api/v1/certificates/generate
   * Body: { donation_id }
   */
  async generate({ request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)

      if (!userId) {
        return response.unauthorized({ success: false, message: 'Token inválido o ausente' })
      }

      const { donation_id } = request.only(['donation_id'])

      if (!donation_id) {
        return response.badRequest({ success: false, message: 'Se requiere donation_id' })
      }

      const cert = await certificateGeneratorService.createCertificate(
        Number(donation_id),
        accessToken
      )

      return response.created({
        success: true,
        message: 'Certificado generado exitosamente',
        data: cert,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al generar certificado',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Descarga el certificado en formato PDF
   * GET /api/v1/certificates/:id/download
   */
  async download({ params, request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)

      if (!userId) {
        return response.unauthorized({ success: false, message: 'Token inválido o ausente' })
      }

      const pdfBuffer = await certificateGeneratorService.generatePDF(params.id)

      response.header('Content-Type', 'application/pdf')
      response.header(
        'Content-Disposition',
        `attachment; filename="certificado-donacion-${params.id}.pdf"`
      )
      response.header('Content-Length', pdfBuffer.length.toString())

      return response.ok(pdfBuffer)
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al generar PDF del certificado',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Verificación pública de autenticidad por QR hash
   * GET /api/v1/certificates/verify/:hash
   */
  async verify({ params, response }: HttpContext) {
    try {
      const supabase = supabaseService.getClient(undefined, true)

      const { data: cert, error } = await supabase
        .from('donation_certificates')
        .select('codigo_certificado, fecha_emision, producto, cantidad, estado, donante_id, donatario_id')
        .eq('qr_hash', params.hash)
        .single()

      if (error || !cert) {
        return response.notFound({
          success: false,
          valid: false,
          message: 'Certificado no encontrado o hash inválido',
        })
      }

      return response.ok({
        success: true,
        valid: true,
        data: {
          codigo_certificado: cert.codigo_certificado,
          fecha_emision: cert.fecha_emision,
          producto: cert.producto,
          cantidad: cert.cantidad,
          estado: cert.estado,
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al verificar certificado',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }
}
