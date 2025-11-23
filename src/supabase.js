// src/supabase.js - VERSÃO CORRIGIDA
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Suas credenciais do Supabase
const supabaseUrl = 'https://unkjvedlsesjufplblgd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVua2p2ZWRsc2VzanVmcGxibGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTI0MTcsImV4cCI6MjA3OTI2ODQxN30.KIotfwLq5OcNQerpr2fcBUh2AO_invnj9YoeJPyoGss';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey)

// Exportar como default e named
export default supabase
export { supabase }

// Função de autenticação melhorada
export async function ensureAuth() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Erro ao obter sessão:', error)
      // Retornar null em vez de lançar erro para evitar quebra da aplicação
      return null
    }
    
    if (session) {
      console.log('✅ Sessão encontrada:', session.user.id)
      return session
    }
    
    console.log('ℹ️ Nenhuma sessão ativa')
    return null
    
  } catch (error) {
    console.error('Erro em ensureAuth:', error)
    return null
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Erro ao obter usuário:', error)
      return null
    }
    return user
  } catch (error) {
    console.error('Erro ao obter usuário:', error)
    return null
  }
}
