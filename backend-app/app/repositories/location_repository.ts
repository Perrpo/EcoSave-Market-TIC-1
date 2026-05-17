import { SupabaseClient } from '@supabase/supabase-js'

export default class LocationRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(tipo?: string) {
    let query = this.supabase.from('locations').select('*')
    
    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    return await query
  }
}
