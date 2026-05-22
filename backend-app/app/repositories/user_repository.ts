import { SupabaseClient } from '@supabase/supabase-js'

export default class UserRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll() {
    return await this.supabase.from('users').select('*')
  }

  async create(data: any) {
    return await this.supabase.from('users').insert([data]).select()
  }

  async getProfile(id: string) {
    return await this.supabase
      .from('profiles')
      .select('id, business, nombre, phone, nit, roles')
      .eq('id', id)
      .maybeSingle()
  }

  async updateProfile(id: string, data: { business?: string; nombre?: string; phone?: string; nit?: string }) {
    return await this.supabase
      .from('profiles')
      .update(data)
      .eq('id', id)
      .select('id, business, nombre, phone, nit, roles')
      .maybeSingle()
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  /** Trae todos los perfiles con su rol — requiere cliente privilegiado */
  async getAllProfiles() {
    return await this.supabase
      .from('profiles')
      .select('id, business, nombre, phone, nit, roles, created_at')
      .order('created_at', { ascending: false })
  }

  /** Cambia el rol de un usuario — guarda como array de strings en mayúsculas */
  async updateUserRole(id: string, role: string) {
    const roleMap: Record<string, string> = {
      supermarket: 'SUPERMERCADO',
      ong: 'ONG',
      admin: 'ADMINISTRADOR',
    }
    const dbRole = roleMap[role] ?? role.toUpperCase()
    return await this.supabase
      .from('profiles')
      .update({ roles: [dbRole] })
      .eq('id', id)
      .select('id, business, nombre, roles')
      .maybeSingle()
  }

  /** Elimina un perfil (soft: marcamos como inactivo si hay campo, si no borramos la fila) */
  async deleteUserProfile(id: string) {
    return await this.supabase
      .from('profiles')
      .delete()
      .eq('id', id)
  }

  /** Métricas globales: cuenta por rol y estados de donaciones */
  async getAdminStats() {
    const [profiles, donations, products] = await Promise.all([
      this.supabase.from('profiles').select('id, roles'),
      this.supabase.from('donations').select('id, status'),
      this.supabase.from('products').select('id, estado'),
    ])

    // roles es un array de strings en mayúsculas: ['SUPERMERCADO'], ['ONG'], ['ADMINISTRADOR']
    const getRole = (p: any): string => {
      const r = Array.isArray(p.roles) ? p.roles[0] : p.roles
      return (r || '').toUpperCase()
    }

    const supermarkets  = (profiles.data || []).filter((p: any) => getRole(p) === 'SUPERMERCADO').length
    const ongs          = (profiles.data || []).filter((p: any) => getRole(p) === 'ONG').length
    const admins        = (profiles.data || []).filter((p: any) => getRole(p) === 'ADMINISTRADOR').length
    const totalUsers    = (profiles.data || []).length

    const donationsTotal     = (donations.data || []).length
    const donationsDone      = (donations.data || []).filter((d: any) => d.status === 'completed').length
    const donationsPending   = (donations.data || []).filter((d: any) => d.status === 'requested').length
    const donationsAvailable = (donations.data || []).filter((d: any) => d.status === 'available').length

    const productsTotal     = (products.data || []).length
    const productsAvailable = (products.data || []).filter((p: any) => p.estado === 'disponible' || p.estado === 'available').length

    return {
      data: {
        supermarkets,
        ongs,
        admins,
        totalUsers,
        donationsTotal,
        donationsDone,
        donationsPending,
        donationsAvailable,
        productsTotal,
        productsAvailable,
      },
      error: profiles.error || donations.error || products.error,
    }
  }
}
