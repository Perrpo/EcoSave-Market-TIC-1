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
}
