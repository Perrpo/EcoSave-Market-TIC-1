import NotificationRepository from '#repositories/notification_repository'
import supabaseService from '#services/supabase_service'

export default class NotificationService {
  private getRepository(accessToken?: string, privileged = false) {
    const client = supabaseService.getClient(accessToken, privileged)
    return new NotificationRepository(client)
  }

  async getUserNotifications(accessToken: string | undefined, userId: string, limit: number, offset: number) {
    const repository = this.getRepository(accessToken, true)
    return await repository.findByUserId(userId, limit, offset)
  }

  async getUnreadNotifications(accessToken: string | undefined, userId: string) {
    const repository = this.getRepository(accessToken, true)
    return await repository.findUnreadByUserId(userId)
  }

  async createNotification(
    data: { user_id: string; type: string; title: string; message: string; product_id?: number },
    privileged = true
  ) {
    // Usualmente creamos notificaciones de forma privilegiada porque un usuario (ej. ONG)
    // necesita crear una notificación para otro usuario (ej. Supermercado)
    const repository = this.getRepository(undefined, privileged)
    return await repository.create(data)
  }

  async markAsRead(accessToken: string | undefined, userId: string, notificationId: string) {
    const repository = this.getRepository(accessToken, true)
    return await repository.markAsRead(notificationId, userId)
  }

  async markAllAsRead(accessToken: string | undefined, userId: string) {
    const repository = this.getRepository(accessToken, true)
    return await repository.markAllAsRead(userId)
  }

  async clearAll(accessToken: string | undefined, userId: string) {
    const repository = this.getRepository(accessToken, true)
    return await repository.deleteByUserId(userId)
  }
}
