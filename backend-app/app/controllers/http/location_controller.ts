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
        console.warn('[Locations] Error no crítico:', error.message || error.code)
        return response.ok({ success: true, data: [] })
      }

      return response.ok({ success: true, data: data || [] })
    } catch (error) {
      console.warn('[Locations] Catch error:', error instanceof Error ? error.message : 'Error desconocido')
      return response.ok({ success: true, data: [] })
    }
  }
}
