import env from '#start/env'

export const supabaseConfig = {
  url: env.get('SUPABASE_URL'),
  anonKey: env.get('SUPABASE_ANON_KEY', env.get('SUPABASE_KEY')),
  serviceKey: env.get('SUPABASE_SERVICE_ROLE_KEY', env.get('SUPABASE_SERVICE_KEY', env.get('SUPABASE_KEY'))),
}
