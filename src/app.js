// src/app.js - VERSÃO COM AUTENTICAÇÃO COMPLETA
import { authManager } from './auth.js';
import { state, MEALS, loadPatientsFromDB } from './state.js';
import supabase from './supabase.js';
import { openPatientManager, initPatientUI } from './patients.js';

class App {
  constructor() {
    this.isInitialized = false;
  }

  async init() {
    console.log('🚀 Inicializando aplicação...');

    try {
      // Verificar se usuário está autenticado
      const isAuthenticated = await authManager.checkAuth();
      
      if (isAuthenticated) {
        console.log('✅ Usuário autenticado:', authManager.currentUser.email);
        await this.showMainApp();
      } else {
        console.log('🔐 Mostrando tela de login');
        authManager.showLogin();
      }

      // Observar mudanças de autenticação
      this.setupAuthListener();

    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
      authManager.showLogin();
    }
  }

  async showMainApp() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.style.background = 'linear-gradient(180deg, #FFFFFF, #f7fbff)';
    app.style.minHeight = '100vh';
    notifyAppReady();
import { notifyAppReady } from './ui.js';
    app.innerHTML = `
      <div class="container">
        <header>
          <h1>🍽️ Montador de Dietas</h1>
          <div class="patient">
            <div style="min-width:200px;">
              <label style="font-size:12px;color:#475569">Paciente Atual</label>
              <div id="patientDisplay" style="padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#0f172a;min-height:40px;display:flex;align-items:center;">
                — nenhum paciente selecionado —
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button id="managePatientsBtn" class="btn" style="background:#10b981;">👥 Gerenciar Pacientes</button>
              <button id="exportPdfBtn" class="btn">📄 Exportar PDF</button>
              <button id="logoutBtn" class="btn" style="background:#ef4444;">🚪 Sair</button>
            </div>
          </div>
        </header>

        <main>
          <!-- Status Message -->
          <div id="statusMessage" style="display:none;"></div>

          <!-- Main Content -->
          <div class="layout" id="mealsContainer">
            <!-- meals injected here -->
            <div id="welcomeMessage" style="text-align:center;padding:40px 20px;color:#64748b;">
              <div style="font-size:48px;margin-bottom:16px;">🍎</div>
              <h2 style="color:#1e40af;margin-bottom:16px;">Bem-vindo ao Sistema Nutricional</h2>
              <p style="margin-bottom:24px;line-height:1.6;">Clique em "Gerenciar Pacientes" para começar a criar dietas personalizadas.</p>
              <button id="quickStartBtn" class="btn" style="background:#1e40af;padding:12px 24px;">
                🚀 Começar Agora
              </button>
            </div>
          </div>

          <div class="summary" id="summaryPanel" style="margin-top:18px;display:none;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
              <div>
                <strong style="font-size:16px;color:var(--azul-escuro)">📊 Resumo Nutricional do Dia</strong>
                <div style="font-size:13px;color:#334155">Totais agregados de todas as refeições</div>
              </div>
              <div class="controls">
                <button id="clearBtn" class="btn" style="background:#ef4444;">🗑️ Limpar Tudo</button>
              </div>
            </div>
            <div id="summaryDetails" style="margin-top:12px;display:flex;gap:12px;flex-wrap:wrap"></div>
            <div id="alerts" class="alerts"></div>
          </div>
        </main>
      </div>

      <!-- Modal template -->
      <div id="modalRoot"></div>

      <!-- Floating Save Button -->
      <button id="saveDietFloating">💾 Salvar Dieta</button>
    `;

    // Carregar dados da aplicação
    await this.loadAppData();
    
    // Anexar eventos
    this.attachEvents();
    
    this.isInitialized = true;
  }

  async loadAppData() {
    try {
      console.log('📦 Carregando dados da aplicação...');
      await loadPatientsFromDB();
      this.loadPatient();
      initPatientUI();
      
      // Carregar módulos dinamicamente
      await import('./tacoLoader.js');
      await import('./ui.js');
      await import('./modals.js');
      await import('./pdf.js');
      
      console.log('✅ Dados carregados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    }
  }

  attachEvents() {
    // Botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => authManager.logout());
    }

    // Botão gerenciar pacientes
    const manageBtn = document.getElementById('managePatientsBtn');
    if (manageBtn) {
      manageBtn.addEventListener('click', () => openPatientManager());
    }

    // Botão quick start
    const quickStart = document.getElementById('quickStartBtn');
    if (quickStart) {
      quickStart.addEventListener('click', () => openPatientManager());
    }

    // Os outros eventos (export PDF, clear) serão anexados pelos módulos específicos
  }

  loadPatient() {
    try {
      const raw = localStorage.getItem('taco_patient_v1');
      if (raw) {
        const p = JSON.parse(raw);
        state.patient = { ...state.patient, ...p };
        console.log('📁 Paciente carregado do localStorage:', p.nome);
      }
    } catch (e) {
      console.warn('⚠️ Nenhum paciente salvo encontrado no localStorage');
    }
  }

  setupAuthListener() {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Mudança de estado de autenticação:', event);
      
      if (event === 'SIGNED_IN' && session) {
        authManager.isAuthenticated = true;
        authManager.currentUser = session.user;
        
        if (!this.isInitialized) {
          await this.showMainApp();
        }
      } else if (event === 'SIGNED_OUT') {
        authManager.isAuthenticated = false;
        authManager.currentUser = null;
        this.isInitialized = false;
        authManager.showLogin();
      }
    });
  }
}

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
  const app = new App();
  await app.init();
  
  // Exportar para debugging
  window.app = app;
  window.authManager = authManager;
});
