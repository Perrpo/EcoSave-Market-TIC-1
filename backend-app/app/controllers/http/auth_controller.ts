import type { HttpContext } from '@adonisjs/core/http'
import supabaseService from '#services/supabase_service'

export default class AuthController {
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

      const supabase = supabaseService.getClient()

      const roleMap: Record<string, string> = {
        supermarket: 'SUPERMERCADO',
        ong: 'ONG',
        admin: 'ADMINISTRADOR',
      }
      const dbRole = roleMap[role] ?? 'SUPERMERCADO'

      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name,
            phone,
            nit,
            role,
          },
        },
      })

      if (authError) {
        return response.badRequest({
          message: authError.message,
        })
      }

      if (authData.user) {
        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            nombre: business_name,
            business: business_name,
            phone,
            nit,
            roles: [dbRole],
            status: 'ACTIVO',
          })
      }

      return response.created({
        message: 'User registered successfully',
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          business_name,
          phone,
          nit,
          role,
        },
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

      const supabase = supabaseService.getClient()

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        return response.unauthorized({
          message: authError.message,
        })
      }

      const roleReverseMap: Record<string, string> = {
        SUPERMERCADO: 'supermarket',
        ONG: 'ong',
        ADMINISTRADOR: 'admin',
        DONANTE: 'supermarket',
      }

      // Preferir rol guardado en metadatos (se establece al registrarse)
      let profileRole = (authData.user?.user_metadata?.role as string) ?? 'supermarket'
      let profileBusiness = authData.user?.user_metadata?.business_name || 'Administrador'
      let profilePhone = authData.user?.user_metadata?.phone || 'N/A'
      let profileNit = authData.user?.user_metadata?.nit || 'N/A'

      if (authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('roles, nit, phone, business')
          .eq('id', authData.user.id)
          .maybeSingle()

        if (profile) {
          const inferredRole = roleReverseMap[profile.roles?.[0]]
          if (inferredRole) {
            profileRole = inferredRole
          }
          profileBusiness = profile.business ?? profileBusiness
          profilePhone = profile.phone ?? profilePhone
          profileNit = profile.nit ?? profileNit
        }
      }

      return response.ok({
        message: 'Login successful',
        token: authData.session?.access_token,
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          businessName: profileBusiness,
          phone: profilePhone,
          nit: profileNit,
          role: profileRole,
        },
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
      const supabase = supabaseService.getClient()

      // Get token from Authorization header
      const authHeader = request.header('Authorization')
      if (!authHeader) {
        return response.unauthorized({
          message: 'No authorization token provided',
        })
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()

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
