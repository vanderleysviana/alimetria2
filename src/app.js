// src/app.js - VERSÃO CORRIGIDA SEM AUTENTICAÇÃO ANÔNIMA
import { nanoid } from "nanoid";
import { jsPDF } from "jspdf";
import Chart from "chart.js/auto";

import { state, MEALS, loadPatientsFromDB } from './state.js';
import supabase, { ensureAuth, getCurrentUser } from './supabase.js';
import './tacoLoader.js';
import './ui.js';
import './modals.js';
import './pdf.js';
import { openPatientManager, initPatientUI } from './patients.js';

// Authentication state
let currentUser = null;

// Initialize auth
async function initAuth() {
  try {
    console.log('🔐 Iniciando autenticação...');
    
    // Tentar obter sessão existente
    const session = await ensureAuth();
    
    if (session) {
      currentUser = session.user;
      console.log('✅ Usuário autenticado:', currentUser.id);
    } else {
      console.log('ℹ️ Modo offline/local - sem autenticação');
      // Continuar sem autenticação para desenvolvimento
      currentUser = { id: 'local-user' };
    }
    
    await loadInitialData();
    
  } catch (error) {
    console.error('❌ Erro na inicialização da autenticação:', error);
    // Continuar em modo offline
    currentUser = { id: 'local-user' };
    await loadInitialData();
  }
}

// Load data after auth
async function loadInitialData() {
  try {
    console.log('📦 Carregando dados iniciais...');
    await loadPatientsFromDB();
    loadPatient();
    initPatientUI();
    console.log('✅ Dados iniciais carregados com sucesso');
  } catch (error) {
    console.error('❌ Erro ao carregar dados iniciais:', error);
  }
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔄 Mudança de estado de autenticação:', event);
  
  if (event === 'SIGNED_IN' && session) {
    currentUser = session.user;
    console.log('✅ Usuário autenticado:', currentUser.id);
    loadInitialData();
  } else if (event === 'SIGNED_OUT') {
    currentUser = { id: 'local-user' };
    console.log('🚪 Usuário deslogado - modo local');
  }
});

// load patient info
function loadPatient(){
  try{
    const raw = localStorage.getItem('taco_patient_v1');
    if(raw){
      const p = JSON.parse(raw);
      state.patient = {...state.patient, ...p};
      console.log('📁 Paciente carregado do localStorage:', p.nome);
    }
  }catch(e){
    console.warn('⚠️ Nenhum paciente salvo encontrado no localStorage');
  }
  renderPatientPanel();
}

function savePatientFromForm(){
  try {
    const p = {
      id: state.patient?.id || null,
      user_id: currentUser?.id || 'local-user',
      nome: document.getElementById('p_name')?.value.trim() || 'Paciente Exemplo',
      data_nascimento: document.getElementById('p_data_nasc')?.value || null,
      genero: document.getElementById('p_genero')?.value || '',
      cpf: document.getElementById('p_cpf')?.value || '',
      telefone: document.getElementById('p_telefone')?.value || '',
      email: document.getElementById('p_email')?.value || '',
      tags: document.getElementById('p_tags')?.value.split(',').map(tag => tag.trim()).filter(tag => tag) || [],
      observacoes: document.getElementById('p_observacoes')?.value.trim() || ''
    };
    
    state.patient = p;
    localStorage.setItem('taco_patient_v1', JSON.stringify(p));
    renderPatientPanel();
    console.log('💾 Paciente salvo:', p.nome);
  } catch (error) {
    console.error('❌ Erro ao salvar paciente:', error);
  }
}

function renderPatientPanel(){
  try {
    const p = state.patient || {};
    const nameEl = document.getElementById('p_name'); if(nameEl) nameEl.value = p.nome || '';
    const dataNascEl = document.getElementById('p_data_nasc'); if(dataNascEl) dataNascEl.value = p.data_nascimento || '';
    const generoEl = document.getElementById('p_genero'); if(generoEl) generoEl.value = p.genero || '';
    const cpfEl = document.getElementById('p_cpf'); if(cpfEl) cpfEl.value = p.cpf || '';
    const telefoneEl = document.getElementById('p_telefone'); if(telefoneEl) telefoneEl.value = p.telefone || '';
    const emailEl = document.getElementById('p_email'); if(emailEl) emailEl.value = p.email || '';
    const tagsEl = document.getElementById('p_tags'); if(tagsEl) tagsEl.value = p.tags?.join(', ') || '';
    const obsEl = document.getElementById('p_observacoes'); if(obsEl) obsEl.value = p.observacoes || '';
    initPatientUI();
  } catch (error) {
    console.error('❌ Erro ao renderizar painel do paciente:', error);
  }
}

// wire save button after DOM ready
document.addEventListener('DOMContentLoaded', async ()=>{
  console.log('🚀 Aplicação iniciando...');
  
  try {
    await initAuth();
    
    const btn = document.getElementById('savePatientBtn');
    if(btn) btn.addEventListener('click', savePatientFromForm);
    
    // wire manager button
    const mgr = document.getElementById('managePatientsBtn');
    if(mgr) mgr.addEventListener('click', ()=> openPatientManager());

    // quick start button
    const quickStart = document.getElementById('quickStartBtn');
    if(quickStart) quickStart.addEventListener('click', ()=> openPatientManager());
    
    console.log('✅ Aplicação inicializada com sucesso');
  } catch (error) {
    console.error('❌ Erro na inicialização da aplicação:', error);
  }
});

// Exportar para debugging
window.appState = state;
window.supabaseClient = supabase;
window.currentUser = currentUser;
