import PDFDocument from 'pdfkit'
import DonationService from '#services/donation_service'

class CertificateGeneratorService {
  private donationService = new DonationService()

  // ─── Utilidades ───────────────────────────────────────────────────────────

  /** Formato colombiano: 185000 → "185.000", 185000.5 → "185.000,5" */
  private formatCOP(value: number): string {
    const hasDecimals = value % 1 !== 0
    return value.toLocaleString('es-CO', {
      minimumFractionDigits: hasDecimals ? 1 : 0,
      maximumFractionDigits: hasDecimals ? 2 : 0,
    })
  }

  /** Fecha larga en español: "1 de enero de 2025" */
  private formatDate(date: Date | string | number): string {
    return new Date(date).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  /** Fecha corta: "01/01/2025" */
  private formatDateShort(date: Date | string | number): string {
    return new Date(date).toLocaleDateString('es-CO')
  }

  /**
   * Período cubierto por una lista de donaciones.
   * "enero de 2025" | "enero – mayo de 2025"
   */
  private getPeriod(donations: any[]): string {
    const times = donations
      .map(d => new Date(d.created_at || d.completed_at || Date.now()).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b)

    if (times.length === 0)
      return new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

    const fmt = (d: Date) => d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    const start = fmt(new Date(times[0]))
    const end   = fmt(new Date(times[times.length - 1]))
    return start === end ? start : `${start} – ${end}`
  }

  // ─── Certificado individual ───────────────────────────────────────────────

  async generateCertificate(donationId: string): Promise<Buffer> {
    const { data: donation, error } = await this.donationService.getDonationById(undefined, donationId)
    if (error || !donation) throw new Error('Donación no encontrada')

    const doc    = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: true })
    const chunks: Buffer[] = []
    doc.on('data', chunk => chunks.push(chunk))

    this.buildSingleCertificate(doc, donation)

    doc.end()
    await new Promise(resolve => doc.on('end', resolve))
    return Buffer.concat(chunks)
  }

  private buildSingleCertificate(doc: PDFKit.PDFDocument, donation: any): void {
    const PAGE_W   = 595
    const MARGIN   = 50
    const COL_W    = PAGE_W - MARGIN * 2  // 495

    const valorUnitario = 5000
    const totalDonado   = (donation.quantity || 1) * valorUnitario
    const deduccion     = totalDonado * 0.37
    const periodo       = this.getPeriod([donation])
    const regId         = String(donation.id).slice(0, 8).toUpperCase()

    // Barra superior
    doc.rect(0, 0, PAGE_W, 6).fill('#2D5A27')

    // ── Título
    doc
      .fillColor('#2D5A27').fontSize(24).font('Helvetica-Bold')
      .text('CERTIFICADO DE DONACIÓN', MARGIN, 30, { align: 'center', width: COL_W })

    doc
      .fillColor('#00A99D').fontSize(10).font('Helvetica')
      .text('ECOSAVE MARKET  ·  Plataforma Anti-Desperdicio de Alimentos', { align: 'center', width: COL_W })

    doc.moveDown(0.6)
    doc.moveTo(MARGIN, doc.y).lineTo(PAGE_W - MARGIN, doc.y).lineWidth(0.5).strokeColor('#CCCCCC').stroke()
    doc.moveDown(0.8)

    // ── Período
    doc
      .fillColor('#888888').fontSize(8).font('Helvetica-Bold')
      .text('PERÍODO CERTIFICADO', { align: 'center', width: COL_W, characterSpacing: 1 })
    doc.moveDown(0.15)
    doc
      .fillColor('#2D5A27').fontSize(12).font('Helvetica-Bold')
      .text(periodo, { align: 'center', width: COL_W })

    doc.moveDown(0.9)

    // ── Cuerpo
    doc
      .fillColor('#333333').fontSize(12).font('Helvetica')
      .text('Por medio del presente documento se certifica la siguiente donación:', { align: 'center', width: COL_W })
    doc.moveDown(0.4)

    doc
      .fillColor('#1a1f2e').fontSize(16).font('Helvetica-Bold')
      .text(
        `${donation.product_name}  ·  ${this.formatCOP(donation.quantity || 1)} unidades`,
        { align: 'center', width: COL_W }
      )
    doc.moveDown(0.25)

    if (donation.product_category) {
      doc
        .fillColor('#666666').fontSize(10).font('Helvetica')
        .text(`Categoría: ${donation.product_category}`, { align: 'center', width: COL_W })
    }

    doc.moveDown(0.7)
    doc
      .fillColor('#555555').fontSize(10).font('Helvetica')
      .text(
        'Esta es una contribución solidaria registrada en EcoSave Market para combatir el desperdicio de alimentos y apoyar a organizaciones sin fines de lucro de Medellín.',
        { align: 'justify', width: COL_W, lineGap: 3 }
      )

    doc.moveDown(1)

    // ── Cuadro de detalles
    const BOX_H = 84
    const boxY  = doc.y
    doc.rect(MARGIN, boxY, COL_W, BOX_H).fillAndStroke('#F8FBF8', '#CCCCCC')

    const L1 = MARGIN + 14
    const L2 = MARGIN + 248
    const labelColor = '#444444'
    const valueColor = '#222222'
    const ROW_GAP    = 18

    const rows: [string, string, string, string][] = [
      ['N.° de Registro:',   `#${regId}`,         'Unidades Donadas:', this.formatCOP(donation.quantity || 1)],
      ['Estado:',            donation.status === 'completed' ? 'Completada y Entregada' : 'Pendiente', 'Val. Unitario Est.:', `$${this.formatCOP(valorUnitario)}`],
      ['Fecha de Donación:', this.formatDate(donation.created_at || Date.now()), 'Fecha de Emisión:', this.formatDate(new Date())],
      ['Categoría:',         donation.product_category || 'General', '', ''],
    ]

    rows.forEach((row, ri) => {
      const rowY2 = boxY + 10 + ri * ROW_GAP
      doc.fillColor(labelColor).fontSize(8).font('Helvetica-Bold')
        .text(row[0], L1, rowY2)
      doc.fillColor(valueColor).fontSize(8).font('Helvetica')
        .text(row[1], L1 + 105, rowY2)

      if (row[2]) {
        doc.fillColor(labelColor).fontSize(8).font('Helvetica-Bold')
          .text(row[2], L2, rowY2)
        doc.fillColor(valueColor).fontSize(8).font('Helvetica')
          .text(row[3], L2 + 118, rowY2)
      }
    })

    // Reposicionar el cursor manualmente después del cuadro
    doc.text('', MARGIN, boxY + BOX_H + 12)

    // ── Valor total
    doc
      .fillColor('#1a1f2e').fontSize(13).font('Helvetica-Bold')
      .text(`VALOR TOTAL ESTIMADO DONADO:  $${this.formatCOP(totalDonado)} COP`, { align: 'center', width: COL_W })

    doc.moveDown(0.9)

    // ── Beneficio tributario
    const taxBoxY = doc.y
    const TAX_H   = 58
    doc.rect(MARGIN, taxBoxY, COL_W, TAX_H).fillAndStroke('#FFF8F0', '#F5C08A')

    doc.fillColor('#7B3F00').fontSize(9).font('Helvetica-Bold')
      .text('BENEFICIO TRIBUTARIO — LEY 2380 DE 2024', MARGIN, taxBoxY + 8, { align: 'center', width: COL_W })

    doc.fillColor('#5C3317').fontSize(9).font('Helvetica')
      .text(
        'Esta donación otorga el derecho a una deducción del 37% sobre el valor total donado,\naplicable en la declaración de renta (Art. 125 E.T. reformado).',
        MARGIN, taxBoxY + 23,
        { align: 'center', width: COL_W, lineGap: 2 }
      )

    // Reposicionar cursor después del cuadro tributario
    doc.text('', MARGIN, taxBoxY + TAX_H + 14)

    doc
      .fillColor('#2D5A27').fontSize(16).font('Helvetica-Bold')
      .text(`VALOR DEDUCIBLE (37%):  $${this.formatCOP(deduccion)} COP`, { align: 'center', width: COL_W })

    doc.moveDown(1.5)

    // ── Pie
    doc.moveTo(MARGIN, doc.y).lineTo(PAGE_W - MARGIN, doc.y).lineWidth(0.5).strokeColor('#CCCCCC').stroke()
    doc.moveDown(0.4)

    doc
      .fillColor('#999999').fontSize(7.5).font('Helvetica')
      .text(
        'Este certificado es generado automáticamente por EcoSave Market y tiene validez para fines contables y tributarios. La veracidad de la donación está registrada de forma inmutable en nuestra plataforma.',
        { align: 'center', width: COL_W, lineGap: 2 }
      )
  }

  // ─── Certificado consolidado ──────────────────────────────────────────────

  async generateConsolidatedCertificate(accessToken: string | undefined, userId: string, role: string): Promise<Buffer> {
    const isOng  = role === 'ong'
    const { data: donations, error } = await this.donationService.getDonations(
      accessToken, 1000, 0,
      isOng ? userId : undefined,
      isOng ? undefined : userId,
      'completed'
    )

    let finalDonations = donations
    if ((!donations || donations.length === 0) && !error) {
      const { data: all } = await this.donationService.getDonations(
        accessToken, 1000, 0,
        isOng ? userId : undefined,
        isOng ? undefined : userId,
        undefined
      )
      finalDonations = all
    }

    if (error || !finalDonations || finalDonations.length === 0)
      throw new Error('No hay donaciones registradas para generar el certificado')

    const doc    = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: true })
    const chunks: Buffer[] = []
    doc.on('data', chunk => chunks.push(chunk))

    this.buildConsolidated(doc, finalDonations, isOng)

    doc.end()
    await new Promise(resolve => doc.on('end', resolve))
    return Buffer.concat(chunks)
  }

  private buildConsolidated(doc: PDFKit.PDFDocument, donations: any[], isOng: boolean): void {
    const PAGE_W  = 595
    const PAGE_H  = 842
    const MARGIN  = 50
    const COL_W   = PAGE_W - MARGIN * 2  // 495
    const BOTTOM  = PAGE_H - MARGIN      // 792 — límite inferior seguro

    const valorUnitario = 5000
    const totalUnidades = donations.reduce((s, d) => s + (d.quantity || 1), 0)
    const totalDonado   = totalUnidades * valorUnitario
    const deduccion     = totalDonado * 0.37
    const periodo       = this.getPeriod(donations)
    const actor         = isOng ? 'recibidas por la organización' : 'realizadas por el establecimiento'

    // Barra superior
    doc.rect(0, 0, PAGE_W, 6).fill('#2D5A27')

    // ── Título
    doc
      .fillColor('#2D5A27').fontSize(22).font('Helvetica-Bold')
      .text('CERTIFICADO CONSOLIDADO ANUAL', MARGIN, 28, { align: 'center', width: COL_W })

    doc
      .fillColor('#00A99D').fontSize(10).font('Helvetica')
      .text('ECOSAVE MARKET  ·  Plataforma Anti-Desperdicio de Alimentos', { align: 'center', width: COL_W })

    doc.moveDown(0.5)
    doc.moveTo(MARGIN, doc.y).lineTo(PAGE_W - MARGIN, doc.y).lineWidth(0.5).strokeColor('#CCCCCC').stroke()
    doc.moveDown(0.7)

    // ── Período
    doc
      .fillColor('#888888').fontSize(8).font('Helvetica-Bold')
      .text('PERÍODO CERTIFICADO', { align: 'center', width: COL_W, characterSpacing: 1 })
    doc.moveDown(0.15)
    doc
      .fillColor('#2D5A27').fontSize(13).font('Helvetica-Bold')
      .text(periodo, { align: 'center', width: COL_W })

    doc.moveDown(0.8)

    // ── Resumen
    doc
      .fillColor('#333333').fontSize(12).font('Helvetica')
      .text(`Por medio del presente documento se certifica el total de donaciones ${actor}:`, { align: 'center', width: COL_W })
    doc.moveDown(0.35)

    doc
      .fillColor('#1a1f2e').fontSize(15).font('Helvetica-Bold')
      .text(
        `${this.formatCOP(donations.length)} donaciones  ·  ${this.formatCOP(totalUnidades)} artículos en total`,
        { align: 'center', width: COL_W }
      )
    doc.moveDown(0.5)

    doc
      .fillColor('#555555').fontSize(10).font('Helvetica')
      .text(
        'Consolidación de todas las contribuciones solidarias registradas en EcoSave Market para combatir el desperdicio de alimentos en Medellín.',
        { align: 'justify', width: COL_W, lineGap: 3 }
      )

    doc.moveDown(0.8)

    // ── Cuadro resumen
    const SUM_H = 72
    const sumY  = doc.y
    doc.rect(MARGIN, sumY, COL_W, SUM_H).fillAndStroke('#F8FBF8', '#CCCCCC')

    const L1 = MARGIN + 14
    const L2 = MARGIN + 248

    const sumRows: [string, string, string, string][] = [
      ['Total de Donaciones:', this.formatCOP(donations.length), 'Valor Unitario Ref.:',  `$${this.formatCOP(valorUnitario)} COP`],
      ['Total de Artículos:',  `${this.formatCOP(totalUnidades)} artículos`, 'Período Certificado:', periodo],
      ['Fecha de Emisión:',    this.formatDate(new Date()), '', ''],
    ]

    sumRows.forEach((row, ri) => {
      const ry = sumY + 10 + ri * 18
      doc.fillColor('#444444').fontSize(8).font('Helvetica-Bold').text(row[0], L1, ry)
      doc.fillColor('#222222').fontSize(8).font('Helvetica').text(row[1], L1 + 125, ry)
      if (row[2]) {
        doc.fillColor('#444444').fontSize(8).font('Helvetica-Bold').text(row[2], L2, ry)
        doc.fillColor('#222222').fontSize(8).font('Helvetica').text(row[3], L2 + 118, ry)
      }
    })

    // Mover cursor después del cuadro
    doc.text('', MARGIN, sumY + SUM_H + 12)

    // ── Valor total
    doc
      .fillColor('#1a1f2e').fontSize(13).font('Helvetica-Bold')
      .text(`VALOR TOTAL ESTIMADO:  $${this.formatCOP(totalDonado)} COP`, { align: 'center', width: COL_W })

    doc.moveDown(0.8)

    // ── Beneficio tributario (solo supermercados)
    if (!isOng) {
      const taxBoxY = doc.y
      const TAX_H   = 56
      doc.rect(MARGIN, taxBoxY, COL_W, TAX_H).fillAndStroke('#FFF8F0', '#F5C08A')

      doc.fillColor('#7B3F00').fontSize(9).font('Helvetica-Bold')
        .text('BENEFICIO TRIBUTARIO — LEY 2380 DE 2024', MARGIN, taxBoxY + 8, { align: 'center', width: COL_W })

      doc.fillColor('#5C3317').fontSize(9).font('Helvetica')
        .text(
          'Estas donaciones otorgan el derecho a una deducción del 37% sobre el valor total donado,\naplicable en la declaración de renta anual (Art. 125 E.T. reformado por la Ley 2380 de 2024).',
          MARGIN, taxBoxY + 23,
          { align: 'center', width: COL_W, lineGap: 2 }
        )

      doc.text('', MARGIN, taxBoxY + TAX_H + 12)

      doc
        .fillColor('#2D5A27').fontSize(15).font('Helvetica-Bold')
        .text(`VALOR TOTAL DEDUCIBLE (37%):  $${this.formatCOP(deduccion)} COP`, { align: 'center', width: COL_W })

      doc.moveDown(0.8)
    }

    // ── Tabla de detalle: máximo 15 filas por página
    const maxRows   = Math.min(donations.length, 15)
    const ROW_H     = 13   // altura de cada fila
    const HDR_H     = 16   // altura de la cabecera
    const COL_WIDTHS = [185, 80, 60, 105, 65]  // suma = 495
    const HEADERS    = ['Producto', 'Categoría', 'Unidades', 'Fecha', 'Estado']

    // Etiqueta sección
    doc
      .fillColor('#444444').fontSize(8).font('Helvetica-Bold')
      .text('DETALLE DE DONACIONES', { characterSpacing: 1, width: COL_W })
    doc.moveDown(0.3)

    const tableNeeded = HDR_H + maxRows * ROW_H + (donations.length > maxRows ? ROW_H : 0) + 4

    // Si no hay espacio suficiente en la página actual, agregar página nueva
    if (doc.y + tableNeeded > BOTTOM - 40) {
      doc.addPage()
      doc.rect(0, 0, PAGE_W, 6).fill('#2D5A27')
      doc.text('', MARGIN, 20)
    }

    // Dibujar cabecera de tabla
    const tableStartY = doc.y
    doc.rect(MARGIN, tableStartY, COL_W, HDR_H).fill('#2D5A27')

    let cx = MARGIN
    HEADERS.forEach((h, i) => {
      doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold')
        .text(h, cx + 3, tableStartY + 4, { width: COL_WIDTHS[i] - 3, align: i === 0 ? 'left' : 'center' })
      cx += COL_WIDTHS[i]
    })

    // Dibujar filas — control explícito de Y para evitar páginas fantasma
    let currentY = tableStartY + HDR_H

    for (let i = 0; i < maxRows; i++) {
      // Verificar si hay espacio en la página actual
      if (currentY + ROW_H > BOTTOM - 20) {
        doc.addPage()
        doc.rect(0, 0, PAGE_W, 6).fill('#2D5A27')
        currentY = 20

        // Repetir cabecera en nueva página
        doc.rect(MARGIN, currentY, COL_W, HDR_H).fill('#2D5A27')
        cx = MARGIN
        HEADERS.forEach((h, hi) => {
          doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold')
            .text(h, cx + 3, currentY + 4, { width: COL_WIDTHS[hi] - 3, align: hi === 0 ? 'left' : 'center' })
          cx += COL_WIDTHS[hi]
        })
        currentY += HDR_H
      }

      const d    = donations[i]
      const even = i % 2 === 0

      doc.rect(MARGIN, currentY, COL_W, ROW_H).fill(even ? '#FFFFFF' : '#F2F8F2')

      const cells = [
        (d.product_name || 'N/A').slice(0, 30),
        (d.product_category || 'General').slice(0, 14),
        this.formatCOP(d.quantity || 1),
        this.formatDateShort(d.created_at || Date.now()),
        d.status === 'completed' ? 'Completada' : 'Pendiente',
      ]

      cx = MARGIN
      cells.forEach((cell, ci) => {
        doc.fillColor('#333333').fontSize(7).font('Helvetica')
          .text(cell, cx + 3, currentY + 3, { width: COL_WIDTHS[ci] - 3, align: ci === 0 ? 'left' : 'center' })
        cx += COL_WIDTHS[ci]
      })

      currentY += ROW_H
    }

    // Mensaje "y X más" si hay más donaciones
    if (donations.length > maxRows) {
      doc.fillColor('#888888').fontSize(7.5).font('Helvetica')
        .text(
          `... y ${this.formatCOP(donations.length - maxRows)} donaciones adicionales registradas en el sistema.`,
          MARGIN, currentY + 4,
          { width: COL_W, align: 'center' }
        )
      currentY += ROW_H + 4
    }

    // ── Posicionar cursor DESPUÉS de la tabla de forma explícita
    doc.text('', MARGIN, currentY + 16)

    // ── Pie de página
    if (doc.y + 50 > BOTTOM) {
      doc.addPage()
      doc.rect(0, 0, PAGE_W, 6).fill('#2D5A27')
      doc.text('', MARGIN, 20)
    }

    doc.moveTo(MARGIN, doc.y).lineTo(PAGE_W - MARGIN, doc.y).lineWidth(0.5).strokeColor('#CCCCCC').stroke()
    doc.moveDown(0.4)

    doc
      .fillColor('#999999').fontSize(7.5).font('Helvetica')
      .text(
        'Este reporte consolidado es generado automáticamente por EcoSave Market y tiene total validez para fines contables y tributarios. La veracidad de las transacciones está registrada de forma inmutable en nuestra plataforma.',
        { align: 'center', width: COL_W, lineGap: 2 }
      )
  }
}

export default new CertificateGeneratorService()
