import PDFDocument from 'pdfkit'
import supabaseService from '#services/supabase_service'

/**
 * Servicio para generación de facturas en PDF
 */
class InvoiceGeneratorService {
  /**
   * Genera una factura en formato PDF
   */
  async generateInvoice(orderId: string): Promise<Buffer> {
    try {
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

      // Crear documento PDF
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks: Buffer[] = []

      // Capturar el PDF en memoria
      doc.on('data', (chunk) => chunks.push(chunk))
      
      // Generar contenido del PDF
      this.generateHeader(doc)
      this.generateCustomerInfo(doc, order)
      this.generateInvoiceTable(doc, order)
      this.generateFooter(doc)

      // Finalizar el documento
      doc.end()

      // Esperar a que termine de generarse
      await new Promise((resolve) => doc.on('end', resolve))

      return Buffer.concat(chunks)
    } catch (error) {
      console.error('Error generating invoice:', error)
      throw error
    }
  }

  /**
   * Genera el encabezado de la factura
   */
  private generateHeader(doc: PDFKit.PDFDocument): void {
    doc
      .fillColor('#00ff9d')
      .fontSize(30)
      .text('ECOSAVE MARKET', 50, 45)
      .fillColor('#666666')
      .fontSize(10)
      .text('Plataforma Anti-Desperdicio', 50, 80)
      .text('www.ecosavemarket.com', 50, 95)
      .text('contacto@ecosavemarket.com', 50, 110)
      .moveDown()

    // Línea decorativa
    doc
      .strokeColor('#00ff9d')
      .lineWidth(2)
      .moveTo(50, 140)
      .lineTo(550, 140)
      .stroke()

    doc
      .fillColor('#ff006e')
      .fontSize(20)
      .text('FACTURA', 400, 50, { align: 'right' })
      .fillColor('#666666')
      .fontSize(10)
      .text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 400, 80, { align: 'right' })
  }

  /**
   * Genera información del cliente
   */
  private generateCustomerInfo(doc: PDFKit.PDFDocument, order: any): void {
    doc
      .fillColor('#333333')
      .fontSize(12)
      .text('INFORMACIÓN DEL CLIENTE', 50, 160)
      .fontSize(10)
      .fillColor('#666666')
      .text(`Nombre: ${order.customer_name}`, 50, 180)
      .text(`Email: ${order.customer_email}`, 50, 195)

    if (order.customer_phone) {
      doc.text(`Teléfono: ${order.customer_phone}`, 50, 210)
    }

    if (order.shipping_address) {
      doc.text(`Dirección: ${order.shipping_address}`, 50, 225)
    }

    doc
      .fillColor('#333333')
      .fontSize(12)
      .text('INFORMACIÓN DE LA ORDEN', 300, 160)
      .fontSize(10)
      .fillColor('#666666')
      .text(`Número de Orden: #${order.id.slice(0, 8).toUpperCase()}`, 300, 180)
      .text(`Estado: ${this.translateStatus(order.status)}`, 300, 195)
      .text(`Método de Pago: ${order.payment_method || 'No especificado'}`, 300, 210)

    doc.moveDown(3)
  }

  /**
   * Genera la tabla de productos
   */
  private generateInvoiceTable(doc: PDFKit.PDFDocument, order: any): void {
    const tableTop = 280
    const itemCodeX = 50
    const descriptionX = 150
    const quantityX = 350
    const priceX = 420
    const amountX = 490

    // Encabezados de la tabla
    doc
      .fillColor('#00ff9d')
      .fontSize(11)
      .text('PRODUCTO', itemCodeX, tableTop)
      .text('DESCRIPCIÓN', descriptionX, tableTop)
      .text('CANT.', quantityX, tableTop)
      .text('PRECIO', priceX, tableTop)
      .text('TOTAL', amountX, tableTop)

    // Línea debajo de encabezados
    doc
      .strokeColor('#00ff9d')
      .lineWidth(1)
      .moveTo(50, tableTop + 20)
      .lineTo(550, tableTop + 20)
      .stroke()

    // Productos
    let position = tableTop + 30
    doc.fillColor('#666666').fontSize(10)

    const products = order.products || []
    
    for (const item of products) {
      const y = position

      doc
        .text(item.product_name.substring(0, 15), itemCodeX, y)
        .text(item.product_name, descriptionX, y, { width: 180 })
        .text(item.quantity.toString(), quantityX, y)
        .text(`$${item.price.toFixed(2)}`, priceX, y)
        .text(`$${(item.quantity * item.price).toFixed(2)}`, amountX, y)

      position += 30
    }

    // Línea antes del total
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(50, position)
      .lineTo(550, position)
      .stroke()

    // Subtotal, impuestos y total
    const subtotal = order.total / 1.16 // Asumiendo 16% IVA
    const tax = order.total - subtotal

    position += 20

    doc
      .fontSize(10)
      .text('Subtotal:', 400, position)
      .text(`$${subtotal.toFixed(2)}`, 490, position)

    position += 20

    doc
      .text('IVA (16%):', 400, position)
      .text(`$${tax.toFixed(2)}`, 490, position)

    position += 20

    doc
      .fillColor('#00ff9d')
      .fontSize(14)
      .text('TOTAL:', 400, position)
      .text(`$${order.total.toFixed(2)}`, 490, position)
  }

  /**
   * Genera el pie de página
   */
  private generateFooter(doc: PDFKit.PDFDocument): void {
    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(
        '¡Gracias por ayudarnos a reducir el desperdicio de alimentos!',
        50,
        700,
        { align: 'center', width: 500 }
      )
      .text(
        'Esta factura es un documento electrónico válido',
        50,
        720,
        { align: 'center', width: 500 }
      )
      .fillColor('#00ff9d')
      .fontSize(8)
      .text(
        'EcoSave Market - Comprometidos con el medio ambiente',
        50,
        750,
        { align: 'center', width: 500 }
      )
  }

  /**
   * Traduce el estado de la orden
   */
  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      pending: 'Pendiente',
      validated: 'Validada',
      processing: 'En Proceso',
      completed: 'Completada',
      cancelled: 'Cancelada',
    }
    return translations[status] || status
  }

  /**
   * Guarda la factura en el sistema de archivos (opcional)
   */
  async saveInvoiceToFile(orderId: string, outputPath: string): Promise<void> {
    const pdfBuffer = await this.generateInvoice(orderId)
    const fs = await import('fs')
    fs.writeFileSync(outputPath, pdfBuffer)
  }
}

export default new InvoiceGeneratorService()
