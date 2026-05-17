import { SupabaseClient } from '@supabase/supabase-js'

export default class UserRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll() {
    return await this.supabase.from('users').select('*')
  }

  async create(data: any) {
    return await this.supabase.from('users').insert([data]).select()
  }
}
