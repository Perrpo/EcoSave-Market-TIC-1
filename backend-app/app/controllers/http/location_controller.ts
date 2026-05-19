import type { HttpContext } from '@adonisjs/core/http'
import supabaseService from '#services/supabase_service'
import LocationService from '#services/location_service'

export default class LocationController {
  private locationService: LocationService

  constructor() {
    this.locationService = new LocationService()
  }

  // GET /locations — listado público filtrable por tipo
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

  // GET /locations/mine — ubicaciones del usuario autenticado
  async mine({ request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      if (!accessToken) return response.unauthorized({ success: false, message: 'Token requerido' })

      const { data: userData } = await supabaseService.getClient().auth.getUser(accessToken)
      if (!userData.user) return response.unauthorized({ success: false, message: 'Usuario no válido' })

      const { data, error } = await this.locationService.getMyLocations(accessToken, userData.user.id)

      if (error) return response.badRequest({ success: false, message: error.message })

      return response.ok({ success: true, data: data || [] })
    } catch (error) {
      return response.internalServerError({ success: false, message: 'Error interno del servidor' })
    }
  }

  // POST /locations — crear una nueva ubicación para el usuario autenticado
  async store({ request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      if (!accessToken) return response.unauthorized({ success: false, message: 'Token requerido' })

      const { data: userData } = await supabaseService.getClient().auth.getUser(accessToken)
      if (!userData.user) return response.unauthorized({ success: false, message: 'Usuario no válido' })

      const body = request.only(['nombre', 'tipo', 'direccion', 'especialidades', 'lat', 'lng'])

      if (!body.nombre || !body.tipo || !body.direccion) {
        return response.badRequest({ success: false, message: 'nombre, tipo y dirección son requeridos' })
      }

      const { data, error } = await this.locationService.createLocation(
        accessToken,
        userData.user.id,
        body
      )

      if (error) return response.badRequest({ success: false, message: error.message })

      return response.created({ success: true, data })
    } catch (error) {
      return response.internalServerError({ success: false, message: 'Error interno del servidor' })
    }
  }

  // PUT /locations/:id — actualizar una ubicación propia
  async update({ params, request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      if (!accessToken) return response.unauthorized({ success: false, message: 'Token requerido' })

      const { data: userData } = await supabaseService.getClient().auth.getUser(accessToken)
      if (!userData.user) return response.unauthorized({ success: false, message: 'Usuario no válido' })

      const body = request.only(['nombre', 'tipo', 'direccion', 'especialidades', 'lat', 'lng'])

      const { data, error } = await this.locationService.updateLocation(
        accessToken,
        userData.user.id,
        Number(params.id),
        body
      )

      if (error) return response.badRequest({ success: false, message: error.message })
      if (!data) return response.notFound({ success: false, message: 'Ubicación no encontrada o no autorizado' })

      return response.ok({ success: true, data })
    } catch (error) {
      return response.internalServerError({ success: false, message: 'Error interno del servidor' })
    }
  }

  // DELETE /locations/:id — eliminar una ubicación propia
  async destroy({ params, request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      if (!accessToken) return response.unauthorized({ success: false, message: 'Token requerido' })

      const { data: userData } = await supabaseService.getClient().auth.getUser(accessToken)
      if (!userData.user) return response.unauthorized({ success: false, message: 'Usuario no válido' })

      const { error } = await this.locationService.deleteLocation(
        accessToken,
        userData.user.id,
        Number(params.id)
      )

      if (error) return response.badRequest({ success: false, message: error.message })

      return response.ok({ success: true, message: 'Ubicación eliminada correctamente' })
    } catch (error) {
      return response.internalServerError({ success: false, message: 'Error interno del servidor' })
    }
  }
}
