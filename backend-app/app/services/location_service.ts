import LocationRepository from '#repositories/location_repository'
import supabaseService from '#services/supabase_service'

export default class LocationService {
  private getRepository(accessToken?: string, privileged = false) {
    const client = supabaseService.getClient(accessToken, privileged)
    return new LocationRepository(client)
  }

  async getLocations(accessToken: string | undefined, tipo?: string) {
    const repository = this.getRepository(accessToken)
    return await repository.findAll(tipo)
  }
}
