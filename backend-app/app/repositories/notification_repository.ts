import { SupabaseClient } from '@supabase/supabase-js'

export default class NotificationRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByUserId(userId: string, limit: number = 50, offset: number = 0) {
    return await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
  }

  async findUnreadByUserId(userId: string) {
    return await this.supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
  }

  async create(data: {
    user_id: string
    type: string
    title: string
    message: string
    product_id?: number
  }) {
    return await this.supabase
      .from('notifications')
      .insert({
        ...data,
        is_read: false,
        urgent: false,
      })
      .select()
      .single()
  }

  async markAsRead(id: string, userId: string) {
    return await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
  }

  async markAllAsRead(userId: string) {
    return await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select()
  }

  async deleteByUserId(userId: string) {
    return await this.supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
  }
}
