// src/app.js - VERSÃO ATUALIZADA
import { nanoid } from "nanoid";
import { jsPDF } from "jspdf";
import Chart from "chart.js/auto";

import { state, MEALS, loadPatientsFromDB } from './state.js';
import './tacoLoader.js';
import './ui.js';
import './modals.js';
import './pdf.js';
import { openPatientManager, initPatientUI } from './patients.js';

// Initialize Supabase
const supabaseUrl = 'https://unkjvedlsesjufplblgd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVua2p2ZWRsc2VzanVmcGxibGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTI0MTcsImV4cCI6MjA3OTI2ODQxN30.KIotfwLq5OcNQerpr2fcBUh2AO_invnj9YoeJPyoGss';
window.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Authentication state
let currentUser = null;

// Initialize auth
async function initAuth() {
  // Check current session
  const { data: { session }, error } = await window.supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return;
  }
  
  if (session) {
    currentUser = session.user;
    console.log('User logged in:', currentUser.email);
    await loadInitialData();
  } else {
    // If no session, try to sign in anonymously
    await signInAnonymously();
  }
}

// Sign in anonymously
async function signInAnonymously() {
  const { data, error } = await window.supabase.auth.signInAnonymously();
  
  if (error) {
    console.error('Error with anonymous auth:', error);
    alert('Erro de autenticação. Recarregue a página.');
    return;
  }
  
  currentUser = data.user;
  console.log('Anonymous user created:', currentUser.id);
  await loadInitialData();
}

// Load data after auth
async function loadInitialData() {
  await loadPatientsFromDB();
  loadPatient();
  initPatientUI();
}

// Listen for auth state changes
window.supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    currentUser = session.user;
    loadInitialData();
  }
});

// load patient info
function loadPatient(){
  try{
    const raw = localStorage.getItem('taco_patient_v1');
    if(raw){
      const p = JSON.parse(raw);
      state.patient = {...state.patient, ...p};
    }
  }catch(e){}
  renderPatientPanel();
}

function savePatientFromForm(){
  const p = {
    id: state.patient?.id || null,
    user_id: currentUser?.id || null,
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
}

function renderPatientPanel(){
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
}

// wire save button after DOM ready
document.addEventListener('DOMContentLoaded', async ()=>{
  await initAuth();
  
  const btn = document.getElementById('savePatientBtn');
  if(btn) btn.addEventListener('click', savePatientFromForm);
  
  // wire manager button
  const mgr = document.getElementById('managePatientsBtn');
  if(mgr) mgr.addEventListener('click', ()=> openPatientManager());

  // quick start button
  const quickStart = document.getElementById('quickStartBtn');
  if(quickStart) quickStart.addEventListener('click', ()=> openPatientManager());
});
