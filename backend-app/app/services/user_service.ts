import UserRepository from '#repositories/user_repository'
import supabaseService from '#services/supabase_service'

export default class UserService {
  private getRepository(accessToken?: string, privileged = false) {
    const client = supabaseService.getClient(accessToken, privileged)
    return new UserRepository(client)
  }

  async getUsers() {
    const repository = this.getRepository()
    return await repository.findAll()
  }

  async createUser(data: any) {
    const repository = this.getRepository()
    return await repository.create(data)
  }

  async getProfile(userId: string, accessToken?: string) {
    const repository = this.getRepository(accessToken, true)
    return await repository.getProfile(userId)
  }

  async updateProfile(userId: string, data: { businessName?: string; phone?: string; nit?: string }, accessToken?: string) {
    const repository = this.getRepository(accessToken, true)
    const updateData: Record<string, string> = {}
    if (data.businessName) {
      updateData.business = data.businessName
      updateData.nombre = data.businessName
    }
    if (data.phone) updateData.phone = data.phone
    if (data.nit) updateData.nit = data.nit
    return await repository.updateProfile(userId, updateData)
  }

  // ─── Admin ───────────────────────────────────────────────────────────────

  /** Lista todos los perfiles (requiere token admin con cliente privilegiado) */
  async getAllProfiles(accessToken?: string) {
    const repository = this.getRepository(accessToken, true)
    return await repository.getAllProfiles()
  }

  /** Cambia el rol de un usuario */
  async updateUserRole(userId: string, role: string, accessToken?: string) {
    const repository = this.getRepository(accessToken, true)
    return await repository.updateUserRole(userId, role)
  }

  /** Elimina el perfil de un usuario */
  async deleteUser(userId: string, accessToken?: string) {
    const repository = this.getRepository(accessToken, true)
    return await repository.deleteUserProfile(userId)
  }

  /** Métricas globales del sistema para el admin */
  async getAdminStats(accessToken?: string) {
    const repository = this.getRepository(accessToken, true)
    return await repository.getAdminStats()
  }
}
