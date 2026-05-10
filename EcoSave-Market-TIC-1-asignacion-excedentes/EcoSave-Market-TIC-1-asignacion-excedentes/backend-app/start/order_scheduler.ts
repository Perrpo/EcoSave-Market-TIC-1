import cron from 'node-cron'
import orderProcessorService from '#services/order_processor_service'

/**
 * Scheduler para procesamiento automático de órdenes
 */

// Procesar órdenes pendientes cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
  console.log('🕐 [CRON] Running automatic order processing...')
  try {
    const results = await orderProcessorService.processPendingOrders()
    const successful = results.filter((r) => r.success).length
    console.log(`✅ [CRON] Processed ${successful}/${results.length} orders`)
  } catch (error) {
    console.error('❌ [CRON] Error processing orders:', error)
  }
})

// Generar reporte de estadísticas cada hora
cron.schedule('0 * * * *', async () => {
  console.log('📊 [CRON] Generating hourly stats report...')
  try {
    const stats = await orderProcessorService.getProcessingStats()
    console.log('📈 [CRON] Order Stats:', stats)
  } catch (error) {
    console.error('❌ [CRON] Error generating stats:', error)
  }
})

// Limpiar órdenes antiguas canceladas (cada día a las 2 AM)
cron.schedule('0 2 * * *', async () => {
  console.log('🧹 [CRON] Cleaning old cancelled orders...')
  // Aquí puedes agregar lógica para archivar o limpiar órdenes antiguas
})

console.log('⏰ Order scheduler initialized')
console.log('  ├─ Auto-processing: Every 5 minutes')
console.log('  ├─ Stats report: Every hour')
console.log('  └─ Cleanup: Daily at 2 AM')
