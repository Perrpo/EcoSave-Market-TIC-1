import { SupabaseClient } from '@supabase/supabase-js'

export default class AuthRepository {
  constructor(private supabase: SupabaseClient) {}

  async signUp(email: string, password: string, metaData: any) {
    return await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metaData,
      },
    })
  }

  async upsertProfile(id: string, data: any) {
    return await this.supabase.from('profiles').upsert({ id, ...data })
  }

  async signInWithPassword(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({
      email,
      password,
    })
  }

  async getProfile(id: string) {
    return await this.supabase
      .from('profiles')
      .select('roles, nit, phone, business')
      .eq('id', id)
      .maybeSingle()
  }

  async signOut(_token?: string) {
    // Note: signout with token is generally global if we use the same client,
    // but typically signing out on the client side handles this. For server-side,
    // just calling signOut() signs out the current session on the client instance.
    return await this.supabase.auth.signOut()
  }
}
