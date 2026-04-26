import { SupabaseClient } from '@supabase/supabase-js'

export default class OrderRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(limit: number, offset: number, status?: string) {
    let query = this.supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    return await query
  }

  async findById(id: string) {
    return await this.supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
  }

  async create(data: any) {
    return await this.supabase
      .from('orders')
      .insert({ ...data, created_at: new Date().toISOString() })
      .select()
      .single()
  }

  async update(id: string, data: any) {
    return await this.supabase
      .from('orders')
      .update(data)
      .eq('id', id)
      .select()
      .single()
  }
}
