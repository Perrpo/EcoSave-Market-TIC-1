import type { HttpContext } from '@adonisjs/core/http'
import supabaseService from '#services/supabase_service'
import NotificationService from '#services/notification_service'

export default class NotificationController {
  private notificationService: NotificationService

  constructor() {
    this.notificationService = new NotificationService()
  }

  async index({ request, response }: HttpContext) {
    try {
      const { limit = 50, offset = 0 } = request.qs()
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)

      if (!userId) {
        return response.unauthorized({ success: false, message: 'Token inválido o ausente' })
      }

      const { data: notifications, error } = await this.notificationService.getUserNotifications(
        accessToken,
        userId,
        Number(limit),
        Number(offset)
      )

      if (error) throw error

      const { count: unreadCount } = await this.notificationService.getUnreadNotifications(accessToken, userId)

      return response.ok({
        success: true,
        data: notifications || [],
        unreadCount: unreadCount || 0
      })
    } catch (error: any) {
      return response.internalServerError({
        success: false,
        message: 'Error al obtener notificaciones',
        error: error.message
      })
    }
  }

  async markAsRead({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)

      if (!userId) {
        return response.unauthorized({ success: false, message: 'Token inválido' })
      }

      const { error } = await this.notificationService.markAsRead(accessToken, userId, id)
      if (error) throw error

      return response.ok({ success: true, message: 'Notificación marcada como leída' })
    } catch (error: any) {
      return response.internalServerError({
        success: false,
        message: 'Error al marcar notificación',
        error: error.message
      })
    }
  }

  async markAllAsRead({ request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)

      if (!userId) return response.unauthorized({ success: false })

      const { error } = await this.notificationService.markAllAsRead(accessToken, userId)
      if (error) throw error

      return response.ok({ success: true })
    } catch (error: any) {
      return response.internalServerError({ success: false, error: error.message })
    }
  }

  async clearAll({ request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)

      if (!userId) return response.unauthorized({ success: false })

      const { error } = await this.notificationService.clearAll(accessToken, userId)
      if (error) throw error

      return response.ok({ success: true })
    } catch (error: any) {
      return response.internalServerError({ success: false, error: error.message })
    }
  }
}
