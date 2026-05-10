import type { HttpContext } from '@adonisjs/core/http'
import orderProcessorService from '#services/order_processor_service'
import orderValidatorService from '#services/order_validator_service'
import invoiceGeneratorService from '#services/invoice_generator_service'
import emailService from '#services/email_service'
import supabaseService from '#services/supabase_service'

export default class OrderController {
  /**
   * Procesa una orden específica
   * POST /api/v1/orders/:id/process
   */
  async processOrder({ params, response }: HttpContext) {
    try {
      const { id } = params
      const result = await orderProcessorService.processOrder(id)

      if (result.success) {
        return response.ok({
          success: true,
          message: result.message,
          data: result,
        })
      } else {
        return response.badRequest({
          success: false,
          message: result.message,
          errors: result.errors,
          warnings: result.warnings,
        })
      }
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al procesar la orden',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Procesa todas las órdenes pendientes
   * POST /api/v1/orders/process-pending
   */
  async processPendingOrders({ response }: HttpContext) {
    try {
      const results = await orderProcessorService.processPendingOrders()

      const successful = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length

      return response.ok({
        success: true,
        message: `Procesadas ${successful} órdenes exitosamente, ${failed} fallidas`,
        data: {
          total: results.length,
          successful,
          failed,
          results,
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al procesar órdenes pendientes',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Valida una orden sin procesarla
   * GET /api/v1/orders/:id/validate
   */
  async validateOrder({ params, response }: HttpContext) {
    try {
      const { id } = params
      const validation = await orderValidatorService.validateOrder(id)

      return response.ok({
        success: validation.isValid,
        data: validation,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al validar la orden',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Genera y descarga la factura de una orden
   * GET /api/v1/orders/:id/invoice
   */
  async downloadInvoice({ params, response }: HttpContext) {
    try {
      const { id } = params
      const pdfBuffer = await invoiceGeneratorService.generateInvoice(id)

      response.header('Content-Type', 'application/pdf')
      response.header('Content-Disposition', `attachment; filename="factura-${id.slice(0, 8)}.pdf"`)
      
      return response.send(pdfBuffer)
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al generar la factura',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Reenvía el email de confirmación
   * POST /api/v1/orders/:id/resend-email
   */
  async resendEmail({ params, response }: HttpContext) {
    try {
      const { id } = params
      const sent = await emailService.sendOrderConfirmation(id)

      if (sent) {
        return response.ok({
          success: true,
          message: 'Email reenviado exitosamente',
        })
      } else {
        return response.badRequest({
          success: false,
          message: 'Error al reenviar el email',
        })
      }
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al reenviar el email',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Cancela una orden
   * POST /api/v1/orders/:id/cancel
   */
  async cancelOrder({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const { reason } = request.only(['reason'])

      const cancelled = await orderProcessorService.cancelOrder(id, reason)

      if (cancelled) {
        return response.ok({
          success: true,
          message: 'Orden cancelada exitosamente',
        })
      } else {
        return response.badRequest({
          success: false,
          message: 'Error al cancelar la orden',
        })
      }
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al cancelar la orden',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Reintenta procesar una orden fallida
   * POST /api/v1/orders/:id/retry
   */
  async retryOrder({ params, response }: HttpContext) {
    try {
      const { id } = params
      const result = await orderProcessorService.retryOrder(id)

      if (result.success) {
        return response.ok({
          success: true,
          message: 'Orden reprocesada exitosamente',
          data: result,
        })
      } else {
        return response.badRequest({
          success: false,
          message: result.message,
          errors: result.errors,
        })
      }
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al reintentar la orden',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Obtiene estadísticas de procesamiento
   * GET /api/v1/orders/stats
   */
  async getStats({ response }: HttpContext) {
    try {
      const stats = await orderProcessorService.getProcessingStats()

      return response.ok({
        success: true,
        data: stats,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Lista todas las órdenes
   * GET /api/v1/orders
   */
  async index({ request, response }: HttpContext) {
    try {
      const { status, limit = 50, offset = 0 } = request.qs()
      
      const supabase = supabaseService.getClient()
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) {
        query = query.eq('status', status)
      }

      const { data: orders, error } = await query

      if (error) {
        return response.badRequest({
          success: false,
          message: 'Error al obtener órdenes',
          error: error.message,
        })
      }

      return response.ok({
        success: true,
        data: orders,
        pagination: {
          limit,
          offset,
          total: orders?.length || 0,
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al listar órdenes',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Obtiene una orden específica
   * GET /api/v1/orders/:id
   */
  async show({ params, response }: HttpContext) {
    try {
      const { id } = params
      const supabase = supabaseService.getClient()

      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !order) {
        return response.notFound({
          success: false,
          message: 'Orden no encontrada',
        })
      }

      return response.ok({
        success: true,
        data: order,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al obtener la orden',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Crea una nueva orden
   * POST /api/v1/orders
   */
  async store({ request, response }: HttpContext) {
    try {
      const orderData = request.only([
        'customer_name',
        'customer_email',
        'customer_phone',
        'products',
        'total',
        'payment_method',
        'shipping_address',
      ])

      const supabase = supabaseService.getClient()

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          ...orderData,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        return response.badRequest({
          success: false,
          message: 'Error al crear la orden',
          error: error.message,
        })
      }

      return response.created({
        success: true,
        message: 'Orden creada exitosamente',
        data: order,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al crear la orden',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Envía un email de prueba
   * POST /api/v1/orders/test-email
   */
  async testEmail({ request, response }: HttpContext) {
    try {
      const { email } = request.only(['email'])

      if (!email) {
        return response.badRequest({
          success: false,
          message: 'Email es requerido',
        })
      }

      const sent = await emailService.sendTestEmail(email)

      if (sent) {
        return response.ok({
          success: true,
          message: `Email de prueba enviado a ${email}`,
        })
      } else {
        return response.badRequest({
          success: false,
          message: 'Error al enviar email de prueba',
        })
      }
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al enviar email de prueba',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }
}
