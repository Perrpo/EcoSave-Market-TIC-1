import type { HttpContext } from '@adonisjs/core/http'
import SupabaseService from '#services/supabase_service'

export default class UserController {
  public async index({ response }: HttpContext) {
    const supabase = SupabaseService.getClient()
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
    
    if (error) {
      return response.status(400).json({ error: error.message })
    }
    
    return response.json(data)
  }
  
  public async store({ request, response }: HttpContext) {
    const supabase = SupabaseService.getClient()
    const body = request.only(['name', 'email'])
    
    const { data, error } = await supabase
      .from('users')
      .insert([body])
      .select()
    
    if (error) {
      return response.status(400).json({ error: error.message })
    }
    
    return response.status(201).json(data)
  }
}