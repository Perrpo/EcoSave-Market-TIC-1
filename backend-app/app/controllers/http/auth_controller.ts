import type { HttpContext } from '@adonisjs/core/http'
import supabaseService from '#services/supabase_service'
import AuthService from '#services/auth_service'

export default class AuthController {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }

  /**
   * Register a new user
   */
  async register({ request, response }: HttpContext) {
    try {
      const { email, password, business_name, phone, nit, role } = request.only(['email', 'password', 'business_name', 'phone', 'nit', 'role'])

      // Validate required fields
      if (!email || !password || !business_name || !phone || !nit || !role) {
        return response.badRequest({
          message: 'Email, password, business name, phone, NIT, and role are required',
        })
      }

      // Validate role
      if (role !== 'supermarket' && role !== 'ong' && role !== 'admin') {
        return response.badRequest({
          message: 'Role must be either "supermarket", "ong", or "admin"',
        })
      }

      const { data: userData, error } = await this.authService.register({
        email,
        password,
        business_name,
        phone,
        nit,
        role
      })

      if (error) {
        return response.badRequest({
          message: error.message,
        })
      }

      return response.created({
        message: 'User registered successfully',
        user: userData,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to register user',
        error: error.message,
      })
    }
  }

  /**
   * Login user
   */
  async login({ request, response }: HttpContext) {
    try {
      const { email, password, role } = request.only(['email', 'password', 'role'])

      // Validate required fields
      if (!email || !password) {
        return response.badRequest({
          message: 'Email and password are required',
        })
      }

      // Validate role if provided
      if (role && role !== 'supermarket' && role !== 'ong' && role !== 'admin') {
        return response.badRequest({
          message: 'Role must be either "supermarket", "ong", or "admin"',
        })
      }

      const { data: loginData, error } = await this.authService.login({
        email,
        password,
        role
      })

      if (error) {
        return response.unauthorized({
          message: error.message,
        })
      }

      return response.ok({
        message: 'Login successful',
        token: loginData?.token,
        user: loginData?.user,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to login',
        error: error.message,
      })
    }
  }

  /**
   * Logout user
   */
  async logout({ request, response }: HttpContext) {
    try {
      // Get token from Authorization header
      const authHeader = request.header('Authorization')
      if (!authHeader) {
        return response.unauthorized({
          message: 'No authorization token provided',
        })
      }

      const accessToken = supabaseService.getAccessToken(authHeader)
      const { error } = await this.authService.logout(accessToken)

      if (error) {
        return response.badRequest({
          message: error.message,
        })
      }

      return response.ok({
        message: 'Logout successful',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to logout',
        error: error.message,
      })
    }
  }
}
