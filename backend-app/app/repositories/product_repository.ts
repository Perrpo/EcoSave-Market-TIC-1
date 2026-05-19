import { SupabaseClient } from '@supabase/supabase-js'

export default class ProductRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAllByUserId(_userId: string, limit: number, offset: number, status?: string) {
    let query = this.supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('estado', status)
    }

    return await query
  }

  async findById(id: string) {
    return await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
  }

  async create(data: any) {
    return await this.supabase
      .from('products')
      .insert({ ...data, created_at: new Date().toISOString() })
      .select()
      .single()
  }

  async update(id: string, data: any) {
    return await this.supabase
      .from('products')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
  }

  async delete(id: string) {
    return await this.supabase
      .from('products')
      .delete()
      .eq('id', id)
  }

  async findAvailable() {
    return await this.supabase
      .from('products')
      .select('*')
      .order('vencimiento', { ascending: true })
  }
}
