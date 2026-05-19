import type { HttpContext } from '@adonisjs/core/http'
import supabaseService from '#services/supabase_service'
import ProductService from '#services/product_service'
import DonationService from '#services/donation_service'

export default class ProductController {
  private productService: ProductService

  constructor() {
    this.productService = new ProductService()
  }

  /**
   * Lista todos los productos del usuario autenticado
   * GET /api/v1/products
   */
  async index({ request, response }: HttpContext) {
    try {
      const { status, limit = 50, offset = 0 } = request.qs()

      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)

      if (!userId) {
        return response.unauthorized({
          success: false,
          message: 'Token inválido o ausente',
        })
      }

      const { data: products, error } = await this.productService.getProductsForUser(
        accessToken,
        userId,
        Number(limit),
        Number(offset),
        status as string | undefined
      )

      if (error) {
        console.error('Supabase products error', error)
        return response.badRequest({
          success: false,
          message: 'Error al obtener productos',
          error: error.message,
        })
      }

      return response.ok({
        success: true,
        data: products || [],
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: products?.length || 0,
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al listar productos',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Crea un nuevo producto para el usuario autenticado
   * POST /api/v1/products
   */
  async store({ request, response }: HttpContext) {
    try {
      const productData = request.only([
        'nombre',
        'categoria',
        'unidades',
        'vencimiento',
        'estado'
      ])

      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))
      const userId = await supabaseService.getUserId(accessToken)

      if (!userId) {
        return response.unauthorized({
          success: false,
          message: 'Token inválido o ausente',
        })
      }

      const { data: product, error } = await this.productService.createProduct(
        accessToken,
        userId,
        productData
      )

      if (error) {
        return response.badRequest({
          success: false,
          message: 'Error al crear producto',
          error: error.message,
        })
      }

      // Automáticamente crear la donación para que las ONGs lo vean instantáneamente
      const donationService = new DonationService()
      await donationService.createDonation(accessToken, userId, {
        product_id: product.id,
        quantity: product.unidades,
        status: 'available'
      })

      return response.created({
        success: true,
        message: 'Producto creado exitosamente',
        data: product,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al crear producto',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Obtiene un producto específico
   * GET /api/v1/products/:id
   */
  async show({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))

      const { data: product, error } = await this.productService.getProductById(accessToken, id)

      if (error || !product) {
        return response.notFound({
          success: false,
          message: 'Producto no encontrado',
        })
      }

      return response.ok({
        success: true,
        data: product,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al obtener producto',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Actualiza un producto
   * PUT /api/v1/products/:id
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const updateData = request.only([
        'nombre',
        'categoria',
        'unidades',
        'vencimiento',
        'estado'
      ])

      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))

      const { data: product, error } = await this.productService.updateProduct(accessToken, id, updateData)

      if (error || !product) {
        return response.notFound({
          success: false,
          message: 'Producto no encontrado o error al actualizar',
        })
      }

      return response.ok({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: product,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al actualizar producto',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Elimina un producto
   * DELETE /api/v1/products/:id
   */
  async destroy({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))

      const { error } = await this.productService.deleteProduct(accessToken, id)

      if (error) {
        return response.badRequest({
          success: false,
          message: 'Error al eliminar producto',
          error: error.message,
        })
      }

      return response.ok({
        success: true,
        message: 'Producto eliminado exitosamente',
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al eliminar producto',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Obtiene productos disponibles para donación (para ONGs)
   * GET /api/v1/products/available
   */
  async getAvailable({ request, response }: HttpContext) {
    try {
      const accessToken = supabaseService.getAccessToken(request.header('Authorization'))

      const { data: products, error } = await this.productService.getAvailableProducts(accessToken)

      if (error) {
        return response.badRequest({
          success: false,
          message: 'Error al obtener productos disponibles',
          error: error.message,
        })
      }

      return response.ok({
        success: true,
        data: products,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al obtener productos disponibles',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }
}
