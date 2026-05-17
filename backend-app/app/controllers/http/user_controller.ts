import type { HttpContext } from '@adonisjs/core/http'
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
}