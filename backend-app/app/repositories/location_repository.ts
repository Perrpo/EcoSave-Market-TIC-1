import { SupabaseClient } from '@supabase/supabase-js'

export default class LocationRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(tipo?: string) {
    let query = this.supabase
      .from('locations')
      .select('*, profiles(nombre, phone, business, roles, nit)')

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    return await query
  }

  async findByProfileId(profileId: string) {
    return await this.supabase
      .from('locations')
      .select('*, profiles(nombre, phone, business, roles, nit)')
      .eq('profile_id', profileId)
  }

  async create(data: {
    nombre: string
    tipo: string
    direccion: string
    especialidades?: string[]
    lat?: number
    lng?: number
    profile_id: string
  }) {
    return await this.supabase
      .from('locations')
      .insert(data)
      .select('*, profiles(nombre, phone, business, roles, nit)')
      .single()
  }

  async update(
    id: number,
    profileId: string,
    data: {
      nombre?: string
      tipo?: string
      direccion?: string
      especialidades?: string[]
      lat?: number
      lng?: number
    }
  ) {
    return await this.supabase
      .from('locations')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('profile_id', profileId) // seguridad: solo puede editar las suyas
      .select('*, profiles(nombre, phone, business, roles, nit)')
      .single()
  }

  async delete(id: number, profileId: string) {
    return await this.supabase
      .from('locations')
      .delete()
      .eq('id', id)
      .eq('profile_id', profileId) // seguridad: solo puede borrar las suyas
  }
}

