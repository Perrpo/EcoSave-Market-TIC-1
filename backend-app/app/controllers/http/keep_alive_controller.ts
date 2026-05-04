import type { HttpContext } from '@adonisjs/core/http'
import supabaseService from '#services/supabase_service'

export default class KeepAliveController {
  public async ping({ response }: HttpContext) {
    try {
      // Usar cliente de servicio para bypassear RLS o simplemente hacer un query
      const client = supabaseService.getClient(undefined, true)
      
      // Hacemos un query simple a una tabla cualquiera, ej. users o products con limit(1)
      // Esto asegura que la base de datos registra actividad
      const { data, error } = await client.from('products').select('id').limit(1)

      if (error) {
        throw error
      }

      return response.status(200).json({ 
        status: 'alive', 
        message: 'Backend y Base de Datos están activos',
        timestamp: new Date().toISOString(),
        db_status: 'connected'
      })
    } catch (error) {
      console.error('Error en keep-alive ping:', error)
      return response.status(500).json({ 
        status: 'error', 
        message: 'Error al contactar la base de datos',
        error: error instanceof Error ? error.message : 'Unknown'
      })
    }
  }
}
