/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import router from '@adonisjs/core/services/router'

// Root route
router.get('/', async () => {
  return {
    message: 'EcoSave Market API',
    version: '1.0.0',
    status: 'running',
    supabase: 'connected'
  }
})

router.group(() => {
  // Health check
  router.get('/health', async () => {
    return { status: 'ok' }
  })

  // Users
  router.resource('users', '#controllers/http/user_controller').apiOnly()
  
  // Products
  // IMPORTANTE: Las rutas estáticas (/available) deben ir ANTES que las dinámicas (/:id)
  // para evitar que "available" sea interpretado como un parámetro :id.
  router.group(() => {
    router.get('/', '#controllers/http/product_controller.index')
    router.post('/', '#controllers/http/product_controller.store')
    router.get('/available', '#controllers/http/product_controller.getAvailable')
    router.get('/:id', '#controllers/http/product_controller.show')
    router.put('/:id', '#controllers/http/product_controller.update')
    router.delete('/:id', '#controllers/http/product_controller.destroy')
  }).prefix('products')
  
  // Donations
  // IMPORTANTE: Las rutas estáticas (/available, /stats) deben ir ANTES que las dinámicas (/:id)
  router.group(() => {
    router.get('/', '#controllers/http/donation_controller.index')
    router.post('/', '#controllers/http/donation_controller.store')
    router.get('/available', '#controllers/http/donation_controller.getAvailable')
    router.get('/stats', '#controllers/http/donation_controller.getStats')
    router.get('/:id', '#controllers/http/donation_controller.show')
    router.post('/:id/request', '#controllers/http/donation_controller.request')
    router.post('/:id/confirm', '#controllers/http/donation_controller.confirm')
  }).prefix('donations')

  // Locations (ONGs)
  router.group(() => {
    router.get('/', '#controllers/http/location_controller.index')
  }).prefix('locations')
  
  // Notifications
  router.group(() => {
    router.get('/', '#controllers/http/notification_controller.index')
    router.post('/mark-all-read', '#controllers/http/notification_controller.markAllAsRead')
    router.post('/clear-all', '#controllers/http/notification_controller.clearAll')
    router.post('/:id/read', '#controllers/http/notification_controller.markAsRead')
  }).prefix('notifications')
  
  // Auth
  router.post('auth/register', '#controllers/http/auth_controller.register')
  router.post('auth/login', '#controllers/http/auth_controller.login')
  // TODO: Register 'auth' middleware in start/kernel.ts before uncommenting
  // router.post('auth/logout', '#controllers/http/auth_controller.logout').middleware('auth')
  router.post('auth/logout', '#controllers/http/auth_controller.logout')
  
  // Orders - RPA Processing System
  router.group(() => {
    // Order CRUD
    router.get('/', '#controllers/http/order_controller.index')
    router.post('/', '#controllers/http/order_controller.store')
    router.get('/:id', '#controllers/http/order_controller.show')
    
    // Order Processing
    router.post('/:id/process', '#controllers/http/order_controller.processOrder')
    router.post('/process-pending', '#controllers/http/order_controller.processPendingOrders')
    router.post('/:id/retry', '#controllers/http/order_controller.retryOrder')
    
    // Order Validation
    router.get('/:id/validate', '#controllers/http/order_controller.validateOrder')
    
    // Invoice Generation
    router.get('/:id/invoice', '#controllers/http/order_controller.downloadInvoice')
    
    // Email Management
    router.post('/:id/resend-email', '#controllers/http/order_controller.resendEmail')
    router.post('/test-email', '#controllers/http/order_controller.testEmail')
    
    // Order Actions
    router.post('/:id/cancel', '#controllers/http/order_controller.cancelOrder')
    
    // Statistics
    router.get('/stats', '#controllers/http/order_controller.getStats')
  }).prefix('orders')
  
}).prefix('/api/v1')
