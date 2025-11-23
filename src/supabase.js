// src/supabase.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://unkjvedlsesjufplblgd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVua2p2ZWRsc2VzanVmcGxibGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTI0MTcsImV4cCI6MjA3OTI2ODQxN30.KIotfwLq5OcNQerpr2fcBUh2AO_invnj9YoeJPyoGss';
export const supabase = createClient(supabaseUrl, supabaseKey)

export async function ensureAuth() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!session) throw new Error('Usuário não autenticado')
  return session
}
