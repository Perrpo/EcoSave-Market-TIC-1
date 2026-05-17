import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import supabaseService from '#services/supabase_service'

export default class AuthMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const authHeader = request.header('Authorization')
    if (!authHeader) {
      return response.unauthorized({ message: 'Authentication required' })
    }

    const token = supabaseService.getAccessToken(authHeader)
    if (!token) {
      return response.unauthorized({ message: 'Invalid token format' })
    }

    const { data, error } = await supabaseService.getClient().auth.getUser(token)
    if (error || !data.user) {
      return response.unauthorized({ message: 'Invalid or expired token' })
    }

    await next()
  }
}
