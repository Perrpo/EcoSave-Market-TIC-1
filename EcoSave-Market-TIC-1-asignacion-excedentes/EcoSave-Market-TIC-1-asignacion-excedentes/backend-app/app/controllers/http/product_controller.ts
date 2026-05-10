import type { HttpContext } from '@adonisjs/core/http'
import supabaseService from '#services/supabase_service'

export default class ProductController {
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

      const supabase = supabaseService.getClient(accessToken, true)

      let query = supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1)

      if (status) {
        query = query.eq('estado', status)
      }

      const { data: products, error } = await query

      if (error) {
        console.error('Supabase products error', error)
      }

      if (error) {
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

      // Calcular estado automáticamente si no se proporciona
      if (!productData.estado) {
        const today = new Date()
        const expiryDate = new Date(productData.vencimiento)
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        let estado = 'Normal'

        if (daysUntilExpiry < 0) {
          estado = 'Vencido'
        } else if (daysUntilExpiry <= 2) {
          estado = 'Urgente'
        } else if (daysUntilExpiry <= 5) {
          estado = 'Advertencia'
        }

        productData.estado = estado
      }

      const supabase = supabaseService.getClient(accessToken, true)

      const { data: product, error } = await supabase
        .from('products')
        .insert({
          user_id: userId,
          nombre: productData.nombre,
          categoria: productData.categoria,
          unidades: productData.unidades,
          vencimiento: productData.vencimiento,
          estado: productData.estado,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        return response.badRequest({
          success: false,
          message: 'Error al crear producto',
          error: error.message,
        })
      }

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
      const supabase = supabaseService.getClient(accessToken)

      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

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
      const supabase = supabaseService.getClient(accessToken)

      const { data: product, error } = await supabase
        .from('products')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

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
      const supabase = supabaseService.getClient(accessToken)

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

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
      const supabase = supabaseService.getClient(accessToken)

      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('vencimiento', { ascending: true })

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
