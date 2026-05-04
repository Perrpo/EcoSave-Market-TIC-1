import PDFDocument from 'pdfkit'
import DonationService from '#services/donation_service'

/**
 * Servicio para generación de certificados de donación en PDF.
 * Incluye el cálculo del 37% de deducción según la Ley 2380 de 2024.
 */
class CertificateGeneratorService {
  private donationService = new DonationService()

  /**
   * Genera un certificado de donación en formato PDF
   */
  async generateCertificate(donationId: string): Promise<Buffer> {
    try {
      const { data: donation, error } = await this.donationService.getDonationById(undefined, donationId)

      if (error || !donation) {
        throw new Error('Donación no encontrada')
      }

      // Crear documento PDF
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks: Buffer[] = []

      // Capturar el PDF en memoria
      doc.on('data', (chunk) => chunks.push(chunk))
      
      // Generar contenido del PDF
      this.generateContent(doc, donation)

      // Finalizar el documento
      doc.end()

      // Esperar a que termine de generarse
      await new Promise((resolve) => doc.on('end', resolve))

      return Buffer.concat(chunks)
    } catch (error) {
      console.error('Error generating certificate:', error)
      throw error
    }
  }

  private generateContent(doc: PDFKit.PDFDocument, donation: any): void {
    // Calculamos un valor estimado promedio por unidad donada para el certificado
    const valorUnitario = 5000;
    const totalDonado = (donation.quantity || 1) * valorUnitario;
    const deduccion = totalDonado * 0.37

    // Encabezado
    doc
      .fillColor('#00ff9d')
      .fontSize(28)
      .text('CERTIFICADO DE DONACIÓN', { align: 'center' })
      .moveDown(0.5)

    doc
      .fillColor('#666666')
      .fontSize(12)
      .text('ECOSAVE MARKET', { align: 'center' })
      .text('Plataforma Anti-Desperdicio', { align: 'center' })
      .moveDown(3)

    // Cuerpo del certificado
    doc
      .fillColor('#333333')
      .fontSize(14)
      .text('Por medio del presente documento certificamos la donación:', { align: 'center' })
      .moveDown()

    doc
      .fontSize(18)
      .text(`${donation.product_name} (${donation.quantity} unidades)`, { align: 'center', underline: true })
      .moveDown()

    doc
      .fontSize(12)
      .text(
        'Esta es una contribución solidaria a través de la plataforma EcoSave Market para combatir el desperdicio de alimentos y apoyar a organizaciones sin fines de lucro.',
        { align: 'justify', lineGap: 5 }
      )
      .moveDown(2)

    // Detalles de la orden
    const boxTop = doc.y
    doc
      .rect(100, boxTop, 395, 80)
      .lineWidth(1)
      .strokeColor('#cccccc')
      .stroke()

    doc
      .fillColor('#666666')
      .fontSize(10)
      .text(`Número de Registro: #${donation.id.slice(0, 8).toUpperCase()}`, 120, boxTop + 15)
      .text(`Fecha de Donación: ${new Date(donation.created_at || Date.now()).toLocaleDateString('es-ES')}`, 120, boxTop + 35)
      .text(`Estado: ${donation.status === 'completed' ? 'Completada y Entregada' : 'Pendiente / En Trámite'}`, 120, boxTop + 55)

    doc.moveDown(5)

    // Montos
    doc
      .fillColor('#333333')
      .fontSize(14)
      .text(`VALOR TOTAL ESTIMADO DONADO: $${totalDonado.toFixed(2)}`, 50, doc.y, { align: 'center' })
      .moveDown(2)

    // Ley 2380/2024
    doc
      .fillColor('#ff006e')
      .fontSize(12)
      .text(
        'De acuerdo con la Ley 2380 de 2024, esta donación otorga el derecho a un beneficio tributario correspondiente a una deducción del 37% sobre el valor total donado aplicable en la declaración de renta.',
        { align: 'justify', lineGap: 3 }
      )
      .moveDown()

    doc
      .fillColor('#00ff9d')
      .fontSize(18)
      .text(`VALOR DEDUCIBLE (37%): $${deduccion.toFixed(2)}`, { align: 'center' })
      .moveDown(4)

    // Pie de página
    doc
      .fillColor('#666666')
      .fontSize(9)
      .text(
        'Este certificado es generado de forma automatizada por el sistema de EcoSave Market y tiene total validez para fines contables y tributarios. La veracidad de esta donación está registrada en nuestra base de datos inmutable.',
        { align: 'center', lineGap: 2 }
      )
  }

  /**
   * Genera un certificado consolidado para todas las donaciones completadas
   */
  async generateConsolidatedCertificate(accessToken: string | undefined, userId: string, role: string): Promise<Buffer> {
    try {
      const isOng = role === 'ong'
      const limit = 1000
      const offset = 0
      const { data: donations, error } = await this.donationService.getDonations(
        accessToken, 
        limit, 
        offset, 
        isOng ? userId : undefined, 
        isOng ? undefined : userId, 
        'completed'
      )

      if (error || !donations || donations.length === 0) {
        throw new Error('No hay donaciones completadas para generar el certificado')
      }

      // Crear documento PDF
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      
      this.generateConsolidatedContent(doc, donations, isOng)

      doc.end()
      await new Promise((resolve) => doc.on('end', resolve))

      return Buffer.concat(chunks)
    } catch (error) {
      console.error('Error generating consolidated certificate:', error)
      throw error
    }
  }

  private generateConsolidatedContent(doc: PDFKit.PDFDocument, donations: any[], isOng: boolean): void {
    const valorUnitario = 5000;
    const totalUnidades = donations.reduce((sum, d) => sum + (d.quantity || 1), 0)
    const totalDonado = totalUnidades * valorUnitario;
    const deduccion = totalDonado * 0.37

    // Encabezado
    doc
      .fillColor('#00A99D')
      .fontSize(24)
      .text('CERTIFICADO CONSOLIDADO ANUAL', { align: 'center' })
      .moveDown(0.5)

    doc
      .fillColor('#666666')
      .fontSize(12)
      .text('ECOSAVE MARKET', { align: 'center' })
      .text('Plataforma Anti-Desperdicio', { align: 'center' })
      .moveDown(2)

    // Cuerpo del certificado
    doc
      .fillColor('#333333')
      .fontSize(14)
      .text(`Por medio del presente documento certificamos que este actor ha ${isOng ? 'recibido' : 'realizado'}:`, { align: 'center' })
      .moveDown()

    doc
      .fontSize(18)
      .text(`${donations.length} donaciones completadas (${totalUnidades} artículos en total)`, { align: 'center', underline: true })
      .moveDown()

    doc
      .fontSize(12)
      .text(
        `Esta es una consolidación de todas las contribuciones solidarias a través de la plataforma EcoSave Market para combatir el desperdicio de alimentos.`,
        { align: 'justify', lineGap: 5 }
      )
      .moveDown(2)

    // Detalles
    const boxTop = doc.y
    doc
      .rect(100, boxTop, 395, 80)
      .lineWidth(1)
      .strokeColor('#cccccc')
      .stroke()

    doc
      .fillColor('#666666')
      .fontSize(10)
      .text(`Total de Donaciones: ${donations.length}`, 120, boxTop + 15)
      .text(`Total de Artículos: ${totalUnidades}`, 120, boxTop + 35)
      .text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`, 120, boxTop + 55)

    doc.moveDown(5)

    // Montos
    doc
      .fillColor('#333333')
      .fontSize(14)
      .text(`VALOR TOTAL ESTIMADO: $${totalDonado.toFixed(2)}`, 50, doc.y, { align: 'center' })
      .moveDown(2)

    if (!isOng) {
      // Ley 2380/2024 (Sólo para supermercados, que son los que deducen)
      doc
        .fillColor('#ff006e')
        .fontSize(12)
        .text(
          'De acuerdo con la Ley 2380 de 2024, estas donaciones otorgan el derecho a un beneficio tributario correspondiente a una deducción del 37% sobre el valor total donado aplicable en la declaración de renta anual.',
          { align: 'justify', lineGap: 3 }
        )
        .moveDown()

      doc
        .fillColor('#00A99D')
        .fontSize(18)
        .text(`VALOR TOTAL DEDUCIBLE (37%): $${deduccion.toFixed(2)}`, { align: 'center' })
        .moveDown(4)
    } else {
      doc.moveDown(6)
    }

    // Pie de página
    doc
      .fillColor('#666666')
      .fontSize(9)
      .text(
        'Este reporte anual es generado de forma automatizada por el sistema de EcoSave Market y tiene total validez para fines contables. La veracidad de estas transacciones está registrada en nuestra base de datos inmutable.',
        { align: 'center', lineGap: 2 }
      )
  }
}

export default new CertificateGeneratorService()
