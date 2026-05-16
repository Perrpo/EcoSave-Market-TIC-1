import PDFDocument from 'pdfkit'
import crypto from 'crypto'
import supabaseService from '#services/supabase_service'

/**
 * Servicio para generación y gestión de certificados de donación
 * Basado en los lineamientos de la Ley 2380 de 2024 (Colombia)
 */
class CertificateGeneratorService {
  /**
   * Genera un código único de certificado
   */
  private generateCertCode(): string {
    const year = new Date().getFullYear()
    const random = crypto.randomBytes(4).toString('hex').toUpperCase()
    return `CERT-${year}-${random}`
  }

  /**
   * Genera el hash de verificación para el QR
   */
  private generateVerificationHash(data: Record<string, unknown>): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16)
  }

  /**
   * Crea y almacena un certificado de donación en Supabase
   */
  async createCertificate(donationId: number, accessToken?: string): Promise<Record<string, unknown>> {
    const supabase = supabaseService.getClient(undefined, true)

    // Obtener datos de la donación con info del supermercado y ONG
    const { data: donation, error: donError } = await supabase
      .from('donations')
      .select(`
        *,
        donor:users!donations_user_id_fkey (
          id, email,
          profile:user_profiles!fk_user_profiles_user (name, business, phone, address)
        ),
        recipient:users!donations_ong_id_fkey (
          id, email,
          profile:user_profiles!fk_user_profiles_user (name, business, phone, address)
        )
      `)
      .eq('id', donationId)
      .single()

    if (donError || !donation) {
      throw new Error('Donación no encontrada')
    }

    if (donation.status !== 'completed') {
      throw new Error('Solo se pueden certificar donaciones completadas')
    }

    // Verificar si ya existe un certificado para esta donación
    const { data: existing } = await supabase
      .from('donation_certificates')
      .select('id')
      .eq('donation_id', donationId)
      .single()

    if (existing) {
      // Retornar el certificado existente
      const { data: cert } = await supabase
        .from('donation_certificates')
        .select('*')
        .eq('donation_id', donationId)
        .single()
      return cert as Record<string, unknown>
    }

    const certCode = this.generateCertCode()
    const now = new Date().toISOString()

    const hashData = {
      codigo: certCode,
      donacion_id: donationId,
      donante_id: donation.user_id,
      donatario_id: donation.ong_id,
      fecha: now,
    }
    const qrHash = this.generateVerificationHash(hashData)

    // Insertar certificado en la base de datos
    const { data: cert, error: certError } = await supabase
      .from('donation_certificates')
      .insert({
        codigo_certificado: certCode,
        donation_id: donationId,
        donante_id: donation.user_id,
        donatario_id: donation.ong_id,
        fecha_emision: now,
        fecha_recepcion: donation.completed_at,
        producto: donation.product_name,
        categoria: donation.product_category,
        cantidad: donation.quantity,
        valor_estimado: donation.valor_estimado ?? 0,
        valor_transporte: 0,
        valor_total: donation.valor_estimado ?? 0,
        qr_hash: qrHash,
        estado: 'vigente',
      })
      .select()
      .single()

    if (certError) {
      throw new Error(`Error al crear certificado: ${certError.message}`)
    }

    return cert as Record<string, unknown>
  }

  /**
   * Genera el PDF del certificado
   */
  async generatePDF(certificateId: string): Promise<Buffer> {
    const supabase = supabaseService.getClient(undefined, true)

    // Traer certificado con datos relacionados
    const { data: cert, error } = await supabase
      .from('donation_certificates')
      .select(`
        *,
        donation:donations (
          product_name, product_category, quantity, expiry_date, completed_at
        ),
        donor:users!donation_certificates_donante_id_fkey (
          email,
          profile:user_profiles!fk_user_profiles_user (name, business, phone, address)
        ),
        recipient:users!donation_certificates_donatario_id_fkey (
          email,
          profile:user_profiles!fk_user_profiles_user (name, business, phone, address)
        )
      `)
      .eq('id', certificateId)
      .single()

    if (error || !cert) {
      throw new Error('Certificado no encontrado')
    }

    return this.buildPDF(cert)
  }

  /**
   * Construye el documento PDF del certificado
   */
  private async buildPDF(cert: Record<string, any>): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))

    const GREEN = '#1a7a4a'
    const LIGHT_GREEN = '#24b26e'
    const DARK = '#1a1a2e'
    const GRAY = '#555555'
    const LIGHT_GRAY = '#f5f5f5'

    const donorName = cert.donor?.profile?.business || cert.donor?.profile?.name || cert.donor?.email || 'Donante'
    const recipientName = cert.recipient?.profile?.business || cert.recipient?.profile?.name || cert.recipient?.email || 'Organización Receptora'
    const donorEmail = cert.donor?.email || ''
    const donorPhone = cert.donor?.profile?.phone || ''
    const donorAddress = cert.donor?.profile?.address || ''
    const recipientEmail = cert.recipient?.email || ''
    const recipientPhone = cert.recipient?.profile?.phone || ''

    // ─── ENCABEZADO ─────────────────────────────────────────────────
    doc.rect(0, 0, 595, 120).fill(GREEN)

    doc
      .fillColor('#ffffff')
      .fontSize(26)
      .font('Helvetica-Bold')
      .text('EcoSave Market', 50, 30)
      .fontSize(10)
      .font('Helvetica')
      .text('Plataforma Anti-Desperdicio de Alimentos', 50, 62)
      .text('www.ecosavemarket.com', 50, 76)

    doc
      .fillColor('#ffffff')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('CERTIFICADO DE DONACIÓN', 300, 38, { align: 'right', width: 245 })
      .fontSize(9)
      .font('Helvetica')
      .text(`N° ${cert.codigo_certificado}`, 300, 68, { align: 'right', width: 245 })
      .text(`Emitido: ${new Date(cert.fecha_emision).toLocaleDateString('es-CO')}`, 300, 82, { align: 'right', width: 245 })

    // ─── TEXTO LEGAL ─────────────────────────────────────────────────
    doc
      .fillColor(DARK)
      .fontSize(10)
      .font('Helvetica')
      .text(
        'El presente certificado se expide en cumplimiento de la Ley 2380 de 2024 de Colombia, que promueve la donación de alimentos aptos para el consumo humano y establece beneficios tributarios para los donantes.',
        50, 135, { width: 495, align: 'justify' }
      )

    // ─── SECCIÓN DONANTE ─────────────────────────────────────────────
    let y = 180
    doc.rect(50, y, 495, 18).fill(LIGHT_GREEN)
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('INFORMACIÓN DEL DONANTE', 58, y + 4)

    y += 25
    doc.rect(50, y, 495, 70).fill(LIGHT_GRAY)
    doc.fillColor(DARK).fontSize(10).font('Helvetica')
    doc.text(`Razón Social / Nombre:`, 60, y + 8).font('Helvetica-Bold').text(donorName, 185, y + 8)
    doc.font('Helvetica').text(`Correo Electrónico:`, 60, y + 22).font('Helvetica-Bold').text(donorEmail, 185, y + 22)
    doc.font('Helvetica').text(`Teléfono:`, 60, y + 36).font('Helvetica-Bold').text(donorPhone || 'N/A', 185, y + 36)
    doc.font('Helvetica').text(`Dirección:`, 60, y + 50).font('Helvetica-Bold').text(donorAddress || 'N/A', 185, y + 50)

    // ─── SECCIÓN DONATARIO ───────────────────────────────────────────
    y += 80
    doc.rect(50, y, 495, 18).fill(LIGHT_GREEN)
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('INFORMACIÓN DEL DONATARIO (ONG RECEPTORA)', 58, y + 4)

    y += 25
    doc.rect(50, y, 495, 55).fill(LIGHT_GRAY)
    doc.fillColor(DARK).fontSize(10).font('Helvetica')
    doc.text(`Entidad Receptora:`, 60, y + 8).font('Helvetica-Bold').text(recipientName, 185, y + 8)
    doc.font('Helvetica').text(`Correo Electrónico:`, 60, y + 22).font('Helvetica-Bold').text(recipientEmail, 185, y + 22)
    doc.font('Helvetica').text(`Teléfono:`, 60, y + 36).font('Helvetica-Bold').text(recipientPhone || 'N/A', 185, y + 36)

    // ─── TABLA DE DONACIÓN ───────────────────────────────────────────
    y += 70
    doc.rect(50, y, 495, 18).fill(LIGHT_GREEN)
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('DETALLE DE LA DONACIÓN', 58, y + 4)

    y += 25
    // Encabezado tabla
    doc.rect(50, y, 495, 18).fill(GREEN)
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
    doc.text('PRODUCTO', 58, y + 5)
    doc.text('CATEGORÍA', 190, y + 5)
    doc.text('CANTIDAD', 310, y + 5)
    doc.text('TIPO', 390, y + 5)
    doc.text('VALOR EST.', 450, y + 5)

    // Fila de datos
    y += 18
    doc.rect(50, y, 495, 22).fill(LIGHT_GRAY)
    doc.fillColor(DARK).fontSize(9).font('Helvetica')
    doc.text(cert.producto || cert.donation?.product_name || 'N/A', 58, y + 6)
    doc.text(cert.categoria || cert.donation?.product_category || 'N/A', 190, y + 6)
    doc.text(String(cert.cantidad ?? cert.donation?.quantity ?? 0), 310, y + 6)
    doc.text('Alimentos', 390, y + 6)
    doc.text(`$${Number(cert.valor_estimado ?? 0).toLocaleString('es-CO')}`, 450, y + 6)

    // Totales
    y += 30
    doc.rect(380, y, 165, 18).fill(LIGHT_GRAY)
    doc.fillColor(DARK).fontSize(9).font('Helvetica')
    doc.text('Costo de transporte:', 385, y + 5)
    doc.font('Helvetica-Bold').text(`$${Number(cert.valor_transporte ?? 0).toLocaleString('es-CO')}`, 500, y + 5)

    y += 20
    doc.rect(380, y, 165, 18).fill(GREEN)
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
    doc.text('VALOR TOTAL CERTIFICADO:', 385, y + 5)
    doc.text(`$${Number(cert.valor_total ?? 0).toLocaleString('es-CO')}`, 500, y + 5)

    // ─── FECHAS ──────────────────────────────────────────────────────
    y += 30
    doc.rect(50, y, 495, 18).fill(LIGHT_GREEN)
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('FECHAS DE LA DONACIÓN', 58, y + 4)

    y += 22
    doc.rect(50, y, 495, 28).fill(LIGHT_GRAY)
    doc.fillColor(DARK).fontSize(9).font('Helvetica')
    doc.text('Fecha de recepción por ONG:', 60, y + 8)
    doc.font('Helvetica-Bold').text(
      cert.fecha_recepcion ? new Date(cert.fecha_recepcion).toLocaleDateString('es-CO') : 'N/A',
      210, y + 8
    )
    doc.font('Helvetica').text('Fecha de emisión del certificado:', 310, y + 8)
    doc.font('Helvetica-Bold').text(
      new Date(cert.fecha_emision).toLocaleDateString('es-CO'),
      490, y + 8
    )

    // ─── MARCO LEGAL ─────────────────────────────────────────────────
    y += 40
    doc.rect(50, y, 495, 50).stroke(GREEN).lineWidth(1)
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
    doc.text(
      'Este certificado fue generado bajo los lineamientos de la Ley 2380 de 2024 de Colombia. La donación aquí registrada puede ser usada como soporte para beneficios tributarios ante la DIAN, siempre que la entidad receptora se encuentre inscrita bajo el Régimen Tributario Especial. EcoSave Market actúa como plataforma de intermediación tecnológica.',
      58, y + 8, { width: 479, align: 'justify' }
    )

    // ─── PIE DE PÁGINA ───────────────────────────────────────────────
    y += 65
    doc
      .strokeColor(LIGHT_GREEN)
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(545, y)
      .stroke()

    y += 10
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
    doc.text(`Código de verificación: ${cert.qr_hash}`, 50, y)
    doc.text(`Estado: ${String(cert.estado || 'vigente').toUpperCase()}`, 50, y + 12)
    doc.text('EcoSave Market — Comprometidos con la reducción del desperdicio alimentario', 50, y + 24, { align: 'center', width: 495 })

    doc.end()
    await new Promise((resolve) => doc.on('end', resolve))
    return Buffer.concat(chunks)
  }

  /**
   * Busca certificados con filtros múltiples (para el repositorio)
   */
  async searchCertificates(filters: {
    codigo_certificado?: string
    donante_id?: number
    donatario_id?: number
    fecha_desde?: string
    fecha_hasta?: string
    estado?: string
    producto?: string
    limit?: number
    offset?: number
  }) {
    const supabase = supabaseService.getClient(undefined, true)
    const { limit = 20, offset = 0, ...rest } = filters

    let query = supabase
      .from('donation_certificates')
      .select(
        `
        id, codigo_certificado, fecha_emision, fecha_recepcion,
        producto, categoria, cantidad, valor_total, estado, qr_hash,
        donation_id,
        donor:users!donation_certificates_donante_id_fkey (
          email,
          profile:user_profiles!fk_user_profiles_user (name, business)
        ),
        recipient:users!donation_certificates_donatario_id_fkey (
          email,
          profile:user_profiles!fk_user_profiles_user (name, business)
        )
      `,
        { count: 'exact' }
      )
      .order('fecha_emision', { ascending: false })
      .range(offset, offset + limit - 1)

    if (rest.codigo_certificado) {
      query = query.ilike('codigo_certificado', `%${rest.codigo_certificado}%`)
    }
    if (rest.donante_id) {
      query = query.eq('donante_id', rest.donante_id)
    }
    if (rest.donatario_id) {
      query = query.eq('donatario_id', rest.donatario_id)
    }
    if (rest.fecha_desde) {
      query = query.gte('fecha_emision', rest.fecha_desde)
    }
    if (rest.fecha_hasta) {
      query = query.lte('fecha_emision', rest.fecha_hasta)
    }
    if (rest.estado) {
      query = query.eq('estado', rest.estado)
    }
    if (rest.producto) {
      query = query.ilike('producto', `%${rest.producto}%`)
    }

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    return { data: data ?? [], total: count ?? 0 }
  }
}

export default new CertificateGeneratorService()
