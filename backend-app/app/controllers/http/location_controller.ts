import type { HttpContext } from '@adonisjs/core/http'
import supabaseService from '#services/supabase_service'
import LocationService from '#services/location_service'

export default class LocationController {
  private locationService: LocationService

  constructor() {
    this.locationService = new LocationService()
  }

  async index({ request, response }: HttpContext) {
    try {
      const { tipo } = request.qs()
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))

      const { data, error } = await this.locationService.getLocations(accessToken, tipo as string | undefined)

      if (error) {
        return response.badRequest({ success: false, message: 'Error al obtener ubicaciones', error: error.message })
      }

      return response.ok({ success: true, data: data || [] })
    } catch (error) {
      return response.internalServerError({ success: false, message: 'Error al obtener ubicaciones', error: error instanceof Error ? error.message : 'Error desconocido' })
    }
  }
}
