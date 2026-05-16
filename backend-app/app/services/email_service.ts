import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import invoiceGeneratorService from '#services/invoice_generator_service'
import supabaseService from '#services/supabase_service'

/**
 * Servicio para envío de emails
 */
class EmailService {
  private transporter: Transporter | null = null

  /**
   * Inicializa el transportador de email
   */
  private async initTransporter(): Promise<void> {
    if (this.transporter) return

    // Configuración para Gmail (desarrollo)
    // En producción, usar servicios como SendGrid, Resend, etc.
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Verificar conexión
    try {
      await this.transporter.verify()
      console.log('✅ Email service ready')
    } catch (error) {
      console.error('❌ Email service error:', error)
    }
  }

  /**
   * Envía confirmación de orden con factura adjunta
   */
  async sendOrderConfirmation(orderId: string): Promise<boolean> {
    try {
      await this.initTransporter()
      if (!this.transporter) {
        throw new Error('Email transporter not initialized')
      }

      const supabase = supabaseService.getClient(undefined, true)
      
      // Obtener datos de la orden
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error || !order) {
        throw new Error('Orden no encontrada')
      }

      // Generar factura PDF
      const invoicePDF = await invoiceGeneratorService.generateInvoice(orderId)

      // Preparar email
      const mailOptions = {
        from: `"EcoSave Market" <${process.env.EMAIL_USER}>`,
        to: order.customer_email,
        subject: `🌱 ¡Gracias por tu Donación! #${orderId.slice(0, 8).toUpperCase()} - EcoSave Market`,
        html: this.generateOrderConfirmationHTML(order),
        attachments: [
          {
            filename: `comprobante-donacion-${orderId.slice(0, 8)}.pdf`,
            content: invoicePDF,
            contentType: 'application/pdf',
          },
        ],
      }

      // Enviar email
      const info = await this.transporter.sendMail(mailOptions)
      console.log('✅ Email sent:', info.messageId)

      // Registrar envío en la base de datos
      await this.logEmailSent(orderId, order.customer_email, 'order_confirmation')

      return true
    } catch (error) {
      console.error('Error sending order confirmation:', error)
      return false
    }
  }

  /**
   * Genera HTML para email de confirmación de orden
   */
  private generateOrderConfirmationHTML(order: any): string {
    const products = order.products || []
    const productsHTML = products
      .map(
        (p: any) => `
        <tr>
          <td style="padding: 15px; border-bottom: 1px solid #eee;">${p.product_name}</td>
          <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity} unidad(es)</td>
        </tr>
      `
      )
      .join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00ff9d 0%, #00b8ff 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .total { font-size: 24px; color: #00ff9d; font-weight: bold; text-align: right; margin-top: 20px; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
          .button { background: #ff006e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💚 ¡Gracias por tu Donación!</h1>
            <p>Has ayudado a rescatar alimentos próximos a vencer</p>
          </div>
          
          <div class="content">
            <div class="order-info">
              <h2>Donación #${order.id.slice(0, 8).toUpperCase()}</h2>
              <p><strong>Cliente:</strong> ${order.customer_name}</p>
              <p><strong>Email:</strong> ${order.customer_email}</p>
              <p><strong>Fecha:</strong> ${new Date(order.created_at).toLocaleDateString('es-ES')}</p>
              ${order.shipping_address ? `<p><strong>Punto de recolección:</strong> ${order.shipping_address}</p>` : ''}
            </div>

            <h3>Alimentos rescatados:</h3>
            <table class="table">
              <thead>
                <tr style="background: #00ff9d; color: white;">
                  <th style="padding: 15px; text-align: left;">Alimento</th>
                  <th style="padding: 15px; text-align: center;">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                ${productsHTML}
              </tbody>
            </table>

            <p style="text-align: center; margin-top: 30px;">
              <a href="http://localhost:5173/dashboard" class="button">Ver mi Dashboard</a>
            </p>

            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0;">🌱 <strong>¡Tu donación hace la diferencia!</strong></p>
              <p style="margin: 10px 0 0 0;">Has evitado que ${products.length} producto(s) terminen en la basura. Estos alimentos serán distribuidos a quienes más lo necesitan.</p>
              <p style="margin: 10px 0 0 0;">💚 Juntos construimos un futuro más sostenible y solidario.</p>
            </div>
          </div>

          <div class="footer">
            <p>EcoSave Market - Plataforma Anti-Desperdicio</p>
            <p>📧 contacto@ecosavemarket.com | 🌐 www.ecosavemarket.com</p>
            <p style="font-size: 12px; margin-top: 10px;">Este es un correo automático, por favor no responder.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Envía notificación de actualización de estado
   */
  async sendStatusUpdate(orderId: string, newStatus: string): Promise<boolean> {
    try {
      await this.initTransporter()
      if (!this.transporter) return false

      const supabase = supabaseService.getClient(undefined, true)
      
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error || !order) return false

      const statusMessages: Record<string, string> = {
        validated: '✅ Tu orden ha sido validada',
        processing: '📦 Tu orden está siendo procesada',
        completed: '🎉 Tu orden ha sido completada',
        cancelled: '❌ Tu orden ha sido cancelada',
      }

      const mailOptions = {
        from: `"EcoSave Market" <${process.env.EMAIL_USER}>`,
        to: order.customer_email,
        subject: `${statusMessages[newStatus] || 'Actualización de orden'} - #${orderId.slice(0, 8).toUpperCase()}`,
        html: this.generateStatusUpdateHTML(order, newStatus),
      }

      await this.transporter.sendMail(mailOptions)
      await this.logEmailSent(orderId, order.customer_email, 'status_update')

      return true
    } catch (error) {
      console.error('Error sending status update:', error)
      return false
    }
  }

  /**
   * Genera HTML para email de actualización de estado
   */
  private generateStatusUpdateHTML(order: any, newStatus: string): string {
    const statusInfo: Record<string, { emoji: string; title: string; message: string }> = {
      validated: {
        emoji: '✅',
        title: 'Orden Validada',
        message: 'Tu orden ha sido validada y pronto será procesada.',
      },
      processing: {
        emoji: '📦',
        title: 'Orden en Proceso',
        message: 'Estamos preparando tu orden para el envío.',
      },
      completed: {
        emoji: '🎉',
        title: 'Orden Completada',
        message: '¡Tu orden ha sido completada exitosamente!',
      },
      cancelled: {
        emoji: '❌',
        title: 'Orden Cancelada',
        message: 'Tu orden ha sido cancelada. Si tienes dudas, contáctanos.',
      },
    }

    const info = statusInfo[newStatus] || {
      emoji: '📋',
      title: 'Actualización de Orden',
      message: 'El estado de tu orden ha sido actualizado.',
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00ff9d 0%, #00b8ff 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-box { background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .emoji { font-size: 48px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Actualización de Orden</h1>
          </div>
          
          <div class="content">
            <div class="status-box">
              <div class="emoji">${info.emoji}</div>
              <h2>${info.title}</h2>
              <p>${info.message}</p>
              <p><strong>Orden:</strong> #${order.id.slice(0, 8).toUpperCase()}</p>
            </div>

            <p style="text-align: center; color: #666;">
              Si tienes alguna pregunta, no dudes en contactarnos.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Registra el envío de email en la base de datos
   */
  private async logEmailSent(
    orderId: string,
    recipient: string,
    emailType: string
  ): Promise<void> {
    try {
      const supabase = supabaseService.getClient(undefined, true)
      
      await supabase.from('email_logs').insert({
        order_id: orderId,
        recipient,
        email_type: emailType,
        sent_at: new Date().toISOString(),
        status: 'sent',
      })
    } catch (error) {
      console.error('Error logging email:', error)
    }
  }

  /**
   * Envía email al supermercado con el certificado de donación adjunto en PDF
   */
  async sendDonationCertificateEmail(certificateId: string, donorUserId: string): Promise<boolean> {
    try {
      await this.initTransporter()
      if (!this.transporter) return false

      const supabase = supabaseService.getClient(undefined, true)

      // Obtener datos del certificado con relaciones
      const { data: cert, error } = await supabase
        .from('donation_certificates')
        .select(`
          *,
          donor:users!donation_certificates_donante_id_fkey (
            email,
            profile:user_profiles!fk_user_profiles_user (name, business)
          ),
          recipient:users!donation_certificates_donatario_id_fkey (
            email,
            profile:user_profiles!fk_user_profiles_user (name, business)
          )
        `)
        .eq('id', certificateId)
        .single()

      if (error || !cert) {
        console.error('Certificado no encontrado para email:', certificateId)
        return false
      }

      // Importar el servicio de certificados para generar el PDF
      const certificateGeneratorService = (await import('#services/certificate_generator_service')).default
      const pdfBuffer = await certificateGeneratorService.generatePDF(certificateId)

      const donorEmail = cert.donor?.email
      if (!donorEmail) return false

      const donorName = cert.donor?.profile?.business || cert.donor?.profile?.name || donorEmail
      const recipientName = cert.recipient?.profile?.business || cert.recipient?.profile?.name || cert.recipient?.email || 'ONG'

      const mailOptions = {
        from: `"EcoSave Market" <${process.env.EMAIL_USER}>`,
        to: donorEmail,
        subject: `📜 Certificado de Donación ${cert.codigo_certificado} - EcoSave Market`,
        html: this.generateCertificateEmailHTML(cert, donorName, recipientName),
        attachments: [
          {
            filename: `certificado-${cert.codigo_certificado}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log('✅ Certificate email sent:', info.messageId)
      return true
    } catch (error) {
      console.error('Error sending certificate email:', error)
      return false
    }
  }

  /**
   * Genera el HTML del email de certificado para el supermercado
   */
  private generateCertificateEmailHTML(cert: any, donorName: string, recipientName: string): string {
    const fechaEmision = new Date(cert.fecha_emision).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #1a7a4a 0%, #24b26e 100%); color: white; padding: 36px 30px; border-radius: 12px 12px 0 0; }
          .header h1 { margin: 0 0 6px; font-size: 22px; }
          .header p { margin: 0; opacity: .85; font-size: 13px; }
          .content { background: #f9f9f9; padding: 30px; }
          .cert-box { background: white; border: 2px solid #24b26e; border-radius: 10px; padding: 24px; margin: 20px 0; }
          .cert-code { font-size: 20px; font-weight: bold; color: #1a7a4a; letter-spacing: 2px; }
          .info-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
          .label { color: #777; }
          .value { font-weight: bold; color: #333; }
          .highlight { background: #e8f5e9; border-left: 4px solid #24b26e; padding: 14px 18px; border-radius: 4px; margin: 20px 0; font-size: 14px; }
          .btn { display: inline-block; background: #1a7a4a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
          .footer { background: #1a1a2e; color: #aaa; padding: 20px 30px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px; }
          .footer a { color: #24b26e; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📜 Tu Certificado de Donación está listo</h1>
            <p>EcoSave Market — Plataforma Anti-Desperdicio de Alimentos</p>
          </div>

          <div class="content">
            <p>Hola, <strong>${donorName}</strong> 👋</p>
            <p>La ONG <strong>${recipientName}</strong> ha confirmado la recepción de tu donación. Hemos generado automáticamente tu <strong>Certificado de Donación</strong> de acuerdo con la <strong>Ley 2380 de 2024</strong> de Colombia.</p>

            <div class="cert-box">
              <div class="cert-code">${cert.codigo_certificado}</div>
              <br/>
              <div class="info-row"><span class="label">Producto donado:</span><span class="value">${cert.producto}</span></div>
              <div class="info-row"><span class="label">Categoría:</span><span class="value">${cert.categoria}</span></div>
              <div class="info-row"><span class="label">Cantidad:</span><span class="value">${cert.cantidad} unidades</span></div>
              <div class="info-row"><span class="label">ONG receptora:</span><span class="value">${recipientName}</span></div>
              <div class="info-row"><span class="label">Fecha de emisión:</span><span class="value">${fechaEmision}</span></div>
              <div class="info-row"><span class="label">Estado:</span><span class="value" style="color:#1a7a4a;">✅ Vigente</span></div>
            </div>

            <div class="highlight">
              💡 <strong>Beneficio tributario:</strong> Este certificado puede usarse como soporte ante la DIAN para deducción de impuestos, siempre que la ONG esté registrada en el Régimen Tributario Especial.
            </div>

            <p>El certificado en <strong>formato PDF</strong> está adjunto a este correo. También puedes descargarlo en cualquier momento desde tu repositorio de certificados:</p>

            <p style="text-align:center;">
              <a href="http://localhost:5173/certificates" class="btn">Ver mis Certificados</a>
            </p>

            <p style="font-size: 13px; color: #777;">Hash de verificación: <code>${cert.qr_hash}</code></p>
          </div>

          <div class="footer">
            <p>EcoSave Market &mdash; Comprometidos con la reducción del desperdicio alimentario</p>
            <p>📧 contacto@ecosavemarket.com &nbsp;|&nbsp; 🌐 <a href="http://www.ecosavemarket.com">www.ecosavemarket.com</a></p>
            <p style="margin-top:10px;">Este es un correo automático, por favor no responder.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Envía email de prueba
   */
  async sendTestEmail(to: string): Promise<boolean> {
    try {
      await this.initTransporter()
      if (!this.transporter) return false

      const mailOptions = {
        from: `"EcoSave Market" <${process.env.EMAIL_USER}>`,
        to,
        subject: '🧪 Test Email - EcoSave Market',
        html: `
          <h1>✅ Email Service Working!</h1>
          <p>Este es un email de prueba del sistema EcoSave Market.</p>
          <p>Si recibes este mensaje, el servicio de email está funcionando correctamente.</p>
        `,
      }

      await this.transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Error sending test email:', error)
      return false
    }
  }
}

export default new EmailService()
