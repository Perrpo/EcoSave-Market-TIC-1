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
    const repository = this.getRepository(accessToken)
    return await repository.getProfile(userId)
  }

  async updateProfile(userId: string, data: { businessName?: string; phone?: string; nit?: string }, accessToken?: string) {
    const repository = this.getRepository(accessToken)
    const updateData: Record<string, string> = {}
    if (data.businessName) {
      updateData.business = data.businessName
      updateData.nombre = data.businessName
    }
    if (data.phone) updateData.phone = data.phone
    if (data.nit) updateData.nit = data.nit
    return await repository.updateProfile(userId, updateData)
  }
}
