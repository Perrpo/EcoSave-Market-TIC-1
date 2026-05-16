import type { HttpContext } from '@adonisjs/core/http'
import supabaseService from '#services/supabase_service'
import { supabaseConfig } from '#config/supabase'

export default class SupabaseTestController {
  /**
   * Test Supabase connection
   */
  async testConnection({ response }: HttpContext) {
    try {
      const supabase = supabaseService.getClient()
      
      // Test connection by getting Supabase status
      const { error } = await supabase.from('_test_').select('*').limit(1)
      
      // Even if the table doesn't exist, if we get a proper error from Supabase, it means we're connected
      if (error) {
        // Check if it's a "table not found" error (which means connection works)
        if (error.message.includes('relation') || error.code === '42P01') {
          return response.ok({
            status: 'connected',
            message: 'Supabase connection is working! (Table test returned expected error)',
            supabase_url: supabaseConfig.url,
            error_detail: error.message
          })
        }
        
        // Other errors might indicate connection issues
        return response.status(500).json({
          status: 'error',
          message: 'Supabase connection failed',
          error: error.message
        })
      }
      
      return response.ok({
        status: 'connected',
        message: 'Supabase connection is working!',
        supabase_url: supabaseConfig.url
      })
    } catch (error) {
      return response.status(500).json({
        status: 'error',
        message: 'Failed to connect to Supabase',
        error: error.message
      })
    }
  }

  /**
   * Get Supabase info
   */
  async info({ response }: HttpContext) {
    try {
      return response.ok({
        status: 'ok',
        supabase_url: supabaseConfig.url,
        message: 'Supabase client is initialized and ready'
      })
    } catch (error) {
      return response.status(500).json({
        status: 'error',
        message: 'Failed to get Supabase info',
        error: error.message
      })
    }
  }
}
