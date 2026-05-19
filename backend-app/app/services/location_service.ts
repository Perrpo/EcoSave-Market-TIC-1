import LocationRepository from '#repositories/location_repository'
import supabaseService from '#services/supabase_service'

export default class LocationService {
  private getRepository(accessToken?: string, privileged = false) {
    const client = supabaseService.getClient(accessToken, privileged)
    return new LocationRepository(client)
  }

  async getLocations(accessToken: string | undefined, tipo?: string) {
    const repository = this.getRepository(accessToken, true)
    return await repository.findAll(tipo)
  }

  async getMyLocations(accessToken: string, profileId: string) {
    const repository = this.getRepository(accessToken, true)
    return await repository.findByProfileId(profileId)
  }

  async createLocation(
    accessToken: string,
    profileId: string,
    data: {
      nombre: string
      tipo: string
      direccion: string
      especialidades?: string[]
      lat?: number
      lng?: number
    }
  ) {
    const repository = this.getRepository(accessToken, true)
    return await repository.create({ ...data, profile_id: profileId })
  }

  async updateLocation(
    accessToken: string,
    profileId: string,
    id: number,
    data: {
      nombre?: string
      tipo?: string
      direccion?: string
      especialidades?: string[]
      lat?: number
      lng?: number
    }
  ) {
    const repository = this.getRepository(accessToken, true)
    return await repository.update(id, profileId, data)
  }

  async deleteLocation(accessToken: string, profileId: string, id: number) {
    const repository = this.getRepository(accessToken, true)
    return await repository.delete(id, profileId)
  }
}
