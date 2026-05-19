import AuthRepository from '#repositories/auth_repository'
import supabaseService from '#services/supabase_service'

export default class AuthService {
  private getRepository(accessToken?: string, privileged = false) {
    const client = supabaseService.getClient(accessToken, privileged)
    return new AuthRepository(client)
  }

  async register(data: any) {
    const repository = this.getRepository()
    // Use privileged client for profile operations to bypass broken RLS on profiles
    const privilegedRepository = this.getRepository(undefined, true)

    const roleMap: Record<string, string> = {
      supermarket: 'SUPERMERCADO',
      ong: 'ONG',
      admin: 'ADMINISTRADOR',
    }
    const dbRole = roleMap[data.role] ?? 'SUPERMERCADO'

    const { data: authData, error: authError } = await repository.signUp(
      data.email,
      data.password,
      {
        business_name: data.business_name,
        phone: data.phone,
        nit: data.nit,
        role: data.role,
      }
    )

    if (authError) {
      return { error: authError, data: null }
    }

    if (authData.user) {
      await privilegedRepository.upsertProfile(authData.user.id, {
        nombre: data.business_name,
        business: data.business_name,
        phone: data.phone,
        nit: data.nit,
        roles: [dbRole],
        estado: 'ACTIVO',
      })
    }

    return {
      error: null,
      data: {
        id: authData.user?.id,
        email: authData.user?.email,
        business_name: data.business_name,
        phone: data.phone,
        nit: data.nit,
        role: data.role,
      }
    }
  }

  async login(data: any) {
    const repository = this.getRepository()

    const { data: authData, error: authError } = await repository.signInWithPassword(
      data.email,
      data.password
    )

    if (authError) {
      return { error: authError, data: null }
    }

    const roleReverseMap: Record<string, string> = {
      SUPERMERCADO: 'supermarket',
      ONG: 'ong',
      ADMINISTRADOR: 'admin',
      DONANTE: 'supermarket',
    }

    let profileRole = (authData.user?.user_metadata?.role as string) ?? 'supermarket'
    let profileBusiness = authData.user?.user_metadata?.business_name || 'Administrador'
    let profilePhone = authData.user?.user_metadata?.phone || 'N/A'
    let profileNit = authData.user?.user_metadata?.nit || 'N/A'

    if (authData.user) {
      // Use privileged client to bypass broken RLS on profiles table
      const privilegedRepo = this.getRepository(undefined, true)
      const { data: profile } = await privilegedRepo.getProfile(authData.user.id)

      if (profile) {
        const inferredRole = roleReverseMap[profile.roles?.[0]]
        if (inferredRole) {
          profileRole = inferredRole
        }
        profileBusiness = profile.business || profile.nombre || profileBusiness
        profilePhone = profile.phone ?? profilePhone
        profileNit = profile.nit ?? profileNit
      }
    }

    return {
      error: null,
      data: {
        token: authData.session?.access_token,
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          businessName: profileBusiness,
          phone: profilePhone,
          nit: profileNit,
          role: profileRole,
        }
      }
    }
  }

  async logout(accessToken?: string) {
    const repository = this.getRepository(accessToken)
    const { error } = await repository.signOut()
    return { error }
  }
}
