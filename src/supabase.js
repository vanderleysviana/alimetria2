// src/supabase.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://pghhuzujutcqbvbctdef.supabase.co' // substitua pela sua URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnaGh1enVqdXRjcWJ2YmN0ZGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMzM0NzIsImV4cCI6MjA3ODkwOTQ3Mn0.nEvaIDWBt0Ba5_pdDmVpOsraAu909w0mdMN6jbbgWBY' // substitua pela sua chave
export const supabase = createClient(supabaseUrl, supabaseKey)

export async function ensureAuth() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!session) throw new Error('Usuário não autenticado')
  return session
}
