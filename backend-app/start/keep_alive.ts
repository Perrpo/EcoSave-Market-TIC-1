import cron from 'node-cron'


// Ejecutar cada 10 minutos para mantener el backend y supabase activos
cron.schedule('*/10 * * * *', async () => {
  try {
    // Obtenemos la URL de la app. Si no está en production, intentaremos usar localhost o el host configurado
    const host = process.env.HOST || '127.0.0.1'
    const port = process.env.PORT || 3333
    const appUrl = process.env.APP_URL || `http://${host}:${port}`
    
    // Endpoint que creamos para mantener viva la app y hacer query a Supabase
    const pingUrl = `${appUrl}/api/v1/keep-alive`
    
    console.log(`💓 [KEEP-ALIVE] Enviando ping a ${pingUrl}...`)
    
    const response = await fetch(pingUrl)
    
    if (response.ok) {
      const data = await response.json() as any
      console.log(`✅ [KEEP-ALIVE] Éxito. DB Status: ${data.db_status}`)
    } else {
      console.error(`⚠️ [KEEP-ALIVE] Falló con status: ${response.status}`)
    }
  } catch (error) {
    console.error('❌ [KEEP-ALIVE] Error al hacer ping:', error instanceof Error ? error.message : String(error))
  }
}, {
  recoverMissedExecutions: false
} as any)

console.log('💓 Keep-Alive service initialized (Runs every 10 minutes)')
