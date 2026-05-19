import { SupabaseClient } from '@supabase/supabase-js'

export default class UserRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll() {
    return await this.supabase.from('users').select('*')
  }

  async create(data: any) {
    return await this.supabase.from('users').insert([data]).select()
  }

  async getProfile(id: string) {
    return await this.supabase
      .from('profiles')
      .select('id, business, nombre, phone, nit, roles')
      .eq('id', id)
      .maybeSingle()
  }

  async updateProfile(id: string, data: { business?: string; nombre?: string; phone?: string; nit?: string }) {
    return await this.supabase
      .from('profiles')
      .update(data)
      .eq('id', id)
      .select('id, business, nombre, phone, nit, roles')
      .maybeSingle()
  }
}
