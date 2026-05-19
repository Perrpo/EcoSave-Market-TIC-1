import type { HttpContext } from '@adonisjs/core/http'
import supabaseService from '#services/supabase_service'
import UserService from '#services/user_service'

export default class UserController {
  private userService: UserService

  constructor() {
    this.userService = new UserService()
  }

  public async index({ response }: HttpContext) {
    const { data, error } = await this.userService.getUsers()

    if (error) {
      return response.status(400).json({ error: error.message })
    }

    return response.json(data)
  }

  public async store({ request, response }: HttpContext) {
    const body = request.only(['name', 'email'])

    const { data, error } = await this.userService.createUser(body)

    if (error) {
      return response.status(400).json({ error: error.message })
    }

    return response.status(201).json(data)
  }

  public async getProfile({ request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)

      if (!userId) {
        return response.unauthorized({ success: false, message: 'Token inválido o ausente' })
      }

      const { data, error } = await this.userService.getProfile(userId, accessToken)

      if (error) {
        return response.badRequest({
          success: false,
          message: 'Error al obtener perfil',
          error: error.message,
        })
      }

      return response.ok({ success: true, data })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error interno',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  public async updateProfile({ request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)

      if (!userId) {
        return response.unauthorized({ success: false, message: 'Token inválido o ausente' })
      }

      const { businessName, phone, nit } = request.only(['businessName', 'phone', 'nit'])

      if (!businessName && !phone && !nit) {
        return response.badRequest({
          success: false,
          message: 'Se requiere al menos un campo para actualizar',
        })
      }

      const { data, error } = await this.userService.updateProfile(
        userId,
        { businessName, phone, nit },
        accessToken
      )

      if (error) {
        return response.badRequest({
          success: false,
          message: 'Error al actualizar perfil',
          error: error.message,
        })
      }

      return response.ok({ success: true, data })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error interno',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }
}
