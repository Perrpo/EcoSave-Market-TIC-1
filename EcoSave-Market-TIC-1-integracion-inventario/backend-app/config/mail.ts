/**
 * Configuración del servicio de email
 */
export const mailConfig = {
  /**
   * Host del servidor SMTP
   */
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',

  /**
   * Puerto del servidor SMTP
   */
  port: parseInt(process.env.EMAIL_PORT || '587'),

  /**
   * Usar conexión segura (SSL/TLS)
   */
  secure: process.env.EMAIL_SECURE === 'true',

  /**
   * Credenciales de autenticación
   */
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },

  /**
   * Configuración del remitente por defecto
   */
  from: {
    name: process.env.EMAIL_FROM_NAME || 'EcoSave Market',
    address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || '',
  },

  /**
   * Opciones adicionales
   */
  options: {
    pool: true, // Usar pool de conexiones
    maxConnections: 5,
    maxMessages: 100,
  },
}

export default mailConfig
