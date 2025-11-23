// src/supabase.js - VERSÃO CORRIGIDA
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Suas credenciais do Supabase
const supabaseUrl = 'https://unkjvedlsesjufplblgd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVua2p2ZWRsc2VzanVmcGxibGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTI0MTcsImV4cCI6MjA3OTI2ODQxN30.KIotfwLq5OcNQerpr2fcBUh2AO_invnj9YoeJPyoGss';

// Criar e exportar o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey)

// Função auxiliar para garantir autenticação
export async function ensureAuth() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Erro ao obter sessão:', error)
      throw error
    }
    
    if (!session) {
      console.log('Nenhuma sessão encontrada, tentando autenticação anônima...')
      const { data, error: signInError } = await supabase.auth.signInAnonymously()
      if (signInError) {
        console.error('Erro na autenticação anônima:', signInError)
        throw signInError
      }
      return data.session
    }
    
    return session
  } catch (error) {
    console.error('Erro em ensureAuth:', error)
    throw error
  }
}

// Função para obter usuário atual
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Erro ao obter usuário:', error)
    throw error
  }
}
