import { SupabaseClient } from '@supabase/supabase-js'

export default class DonationRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(limit: number, offset: number, ongId?: string, userId?: string, status?: string) {
    let query = this.supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (ongId) {
      query = query.eq('ong_id', ongId)
    } else if (userId) {
      query = query.eq('user_id', userId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    return await query
  }

  async findById(id: string) {
    return await this.supabase
      .from('donations')
      .select('*')
      .eq('id', id)
      .single()
  }

  async create(data: any) {
    return await this.supabase
      .from('donations')
      .insert(data)
      .select()
      .single()
  }

  async update(id: string, data: any) {
    return await this.supabase
      .from('donations')
      .update(data)
      .eq('id', id)
      .select()
      .single()
  }

  async findAvailable() {
    return await this.supabase
      .from('donations')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
  }

  async getStats(ongId?: string, userId?: string) {
    let query = this.supabase.from('donations').select('*')

    if (ongId) {
      query = query.eq('ong_id', ongId)
    } else if (userId) {
      query = query.eq('user_id', userId)
    }

    return await query
  }
}
