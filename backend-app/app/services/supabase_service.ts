import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '#config/supabase'

class SupabaseService {
  private anonClient
  private serviceClient

  constructor() {
    const anonKey = supabaseConfig.anonKey || supabaseConfig.serviceKey
    const serviceKey = supabaseConfig.serviceKey || supabaseConfig.anonKey

    this.anonClient = createClient(supabaseConfig.url, anonKey, {
      auth: { persistSession: false },
    })
    this.serviceClient = createClient(supabaseConfig.url, serviceKey, {
      auth: { persistSession: false },
    })
  }

  /**
   * Cliente que respeta RLS (usa anonKey) salvo que se pida privileged=true.
   * Si viene accessToken agrega el header Authorization para que RLS reconozca al usuario.
   * Si privileged=true y existe serviceKey distinta, usa service client (bypassa RLS); si no, usa anon + token.
   */
  public getClient(accessToken?: string, privileged = false) {
    const hasServiceKey =
      supabaseConfig.serviceKey &&
      supabaseConfig.anonKey &&
      supabaseConfig.serviceKey !== supabaseConfig.anonKey

    if (privileged && hasServiceKey) {
      // Usar service client (sin header) solo cuando realmente hay service role key
      return this.serviceClient
    }

    const key = supabaseConfig.anonKey || supabaseConfig.serviceKey
    if (!accessToken) {
      return this.anonClient
    }

    const headers = { Authorization: `Bearer ${accessToken}` }

    return createClient(supabaseConfig.url, key, {
      auth: { persistSession: false },
      global: { headers },
    })
  }

  public getAccessToken(authHeader?: string) {
    if (!authHeader) return undefined
    return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  }

  public async getUserId(accessToken?: string): Promise<string | null> {
    if (!accessToken) return null

    try {
      const tokenParts = accessToken.split('.')
      if (tokenParts.length !== 3) return null
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], 'base64').toString('utf8')
      )
      return payload.sub || payload.user_id || null
    } catch (_e) {
      return null
    }
  }
}

export default new SupabaseService()
