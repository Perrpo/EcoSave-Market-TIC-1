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

  // ─── Admin endpoints ─────────────────────────────────────────────────────

  /**
   * Middleware de rol: verifica que el token pertenece a un usuario con roles=['ADMINISTRADOR'].
   * El campo `roles` en profiles es un ARRAY de strings en mayúsculas (ej: ['ADMINISTRADOR']).
   * Retorna el userId si pasa, o lanza respuesta 403 si no.
   */
  private async requireAdmin(request: HttpContext['request'], response: HttpContext['response']): Promise<string | null> {
    const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
    const userId = await supabaseService.getUserId(accessToken)

    if (!userId) {
      response.unauthorized({ success: false, message: 'Token inválido o ausente' })
      return null
    }

    // Usar cliente privilegiado para leer el perfil sin restricciones RLS
    const { data: profile } = await this.userService.getProfile(userId, undefined)
    if (!profile) {
      response.forbidden({ success: false, message: 'Perfil no encontrado' })
      return null
    }

    // roles es un array: ['ADMINISTRADOR'] | ['SUPERMERCADO'] | ['ONG']
    const rolesArr: string[] = Array.isArray(profile.roles) ? profile.roles : [profile.roles]
    const isAdmin = rolesArr.some(
      (r: string) => r === 'ADMINISTRADOR' || r?.toLowerCase() === 'admin'
    )

    if (!isAdmin) {
      response.forbidden({ success: false, message: 'Acceso denegado: se requiere rol administrador' })
      return null
    }

    return userId
  }

  /** GET /api/v1/admin/users — lista todos los perfiles */
  public async adminGetUsers({ request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const adminId = await this.requireAdmin(request, response)
      if (!adminId) return

      const { data, error } = await this.userService.getAllProfiles(accessToken)

      if (error) {
        return response.badRequest({ success: false, message: error.message })
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

  /** PATCH /api/v1/admin/users/:id/role — cambiar rol */
  public async adminUpdateUserRole({ params, request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const adminId = await this.requireAdmin(request, response)
      if (!adminId) return

      const { role } = request.only(['role'])

      if (!role || !['supermarket', 'ong', 'admin'].includes(role)) {
        return response.badRequest({ success: false, message: 'Rol inválido. Debe ser: supermarket, ong, o admin' })
      }

      const { data, error } = await this.userService.updateUserRole(params.id, role, accessToken)

      if (error) {
        return response.badRequest({ success: false, message: error.message })
      }

      return response.ok({ success: true, data, message: 'Rol actualizado correctamente' })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error interno',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /** DELETE /api/v1/admin/users/:id — eliminar usuario */
  public async adminDeleteUser({ params, request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const adminId = await this.requireAdmin(request, response)
      if (!adminId) return

      if (params.id === adminId) {
        return response.badRequest({ success: false, message: 'No puedes eliminar tu propia cuenta de administrador' })
      }

      const { error } = await this.userService.deleteUser(params.id, accessToken)

      if (error) {
        return response.badRequest({ success: false, message: error.message })
      }

      return response.ok({ success: true, message: 'Usuario eliminado correctamente' })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error interno',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /** GET /api/v1/admin/stats — métricas globales */
  public async adminGetStats({ request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const adminId = await this.requireAdmin(request, response)
      if (!adminId) return

      const { data, error } = await this.userService.getAdminStats(accessToken)

      if (error) {
        return response.badRequest({ success: false, message: error.message })
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

  /** GET /api/v1/admin/donations — todas las donaciones para monitoreo */
  public async adminGetDonations({ request, response }: HttpContext) {
    try {
      const adminId = await this.requireAdmin(request, response)
      if (!adminId) return

      // Usamos el cliente privilegiado ya configurado en supabaseService (evita imports dinámicos frágiles)
      const client = supabaseService.getClient(undefined, true)

      const limit  = Number(request.input('limit',  50))
      const offset = Number(request.input('offset', 0))
      const status = request.input('status')

      let query = client
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) query = query.eq('status', status)

      const { data, error } = await query

      if (error) {
        return response.badRequest({ success: false, message: error.message })
      }

      return response.ok({ success: true, data: data || [] })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error interno',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }
}
