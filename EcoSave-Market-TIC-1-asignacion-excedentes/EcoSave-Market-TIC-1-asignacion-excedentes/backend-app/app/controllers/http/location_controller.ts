import type { HttpContext } from '@adonisjs/core/http'
import supabaseService from '#services/supabase_service'

export default class LocationController {
  async index({ request, response }: HttpContext) {
    try {
      const { tipo } = request.qs()
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const supabase = supabaseService.getClient(accessToken)

      let query = supabase.from('locations').select('*')
      if (tipo) {
        query = query.eq('tipo', tipo)
      }

      const { data, error } = await query
      if (error) {
        return response.badRequest({ success: false, message: 'Error al obtener ubicaciones', error: error.message })
      }

      return response.ok({ success: true, data: data || [] })
    } catch (error) {
      return response.internalServerError({ success: false, message: 'Error al obtener ubicaciones', error: error instanceof Error ? error.message : 'Error desconocido' })
    }
  }
}
