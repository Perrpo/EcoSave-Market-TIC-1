import { SupabaseClient } from '@supabase/supabase-js'

export default class EmailLogRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(data: { order_id: string; recipient: string; email_type: string; status: string }) {
    return await this.supabase.from('email_logs').insert({
      ...data,
      sent_at: new Date().toISOString()
    })
  }
}
