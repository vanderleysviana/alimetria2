// src/app.js - VERSÃO COMPLETA COM AUTENTICAÇÃO
import { authManager } from './auth.js';
import { state, MEALS, loadPatientsFromDB } from './state.js';
import supabase from './supabase.js';
import { openPatientManager, initPatientUI } from './patients.js';
import { notifyAppReady, initUI } from './ui.js';

class App {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
  }

  async init() {
    console.log('🚀 Inicializando aplicação...');

    try {
      // Verificar se usuário está autenticado
      const isAuthenticated = await authManager.checkAuth();
      
      if (isAuthenticated) {
        this.currentUser = authManager.currentUser;
        console.log('✅ Usuário autenticado:', this.currentUser.email);
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
    try {
      console.log('📱 Carregando aplicação principal...');
      
      const app = document.getElementById('app');
      if (!app) {
        console.error('❌ Elemento #app não encontrado');
        return;
      }

      app.innerHTML = '';
      app.style.background = 'linear-gradient(180deg, #FFFFFF, #f7fbff)';
      app.style.minHeight = '100vh';

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
        <button id="saveDietFloating" style="display:none;">💾 Salvar Dieta</button>
      `;

      // Carregar dados da aplicação
      await this.loadAppData();
      
      // Anexar eventos
      this.attachEvents();
      
      // Inicializar UI
      initUI();
      
      // Notificar que a aplicação está pronta
      notifyAppReady();
      
      this.isInitialized = true;
      console.log('✅ Aplicação principal carregada com sucesso');

    } catch (error) {
      console.error('❌ Erro ao carregar aplicação principal:', error);
    }
  }

  async loadAppData() {
    try {
      console.log('📦 Carregando dados da aplicação...');
      
      // Carregar pacientes do banco
      await loadPatientsFromDB();
      
      // Carregar paciente salvo localmente
      this.loadPatient();
      
      // Inicializar UI do paciente
      initPatientUI();
      
      // Carregar módulos dinamicamente
      await this.loadModules();
      
      console.log('✅ Dados carregados com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    }
  }

  async loadModules() {
    try {
      // Carregar módulos essenciais
      const modules = [
        './tacoLoader.js',
        './modals.js', 
        './pdf.js',
        './patientDiets.js',
        './consultations.js'
      ];

      for (const modulePath of modules) {
        try {
          await import(modulePath);
          console.log(`✅ Módulo carregado: ${modulePath}`);
        } catch (error) {
          console.warn(`⚠️ Erro ao carregar módulo ${modulePath}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar módulos:', error);
    }
  }

  attachEvents() {
    try {
      // Botão de logout
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          if (confirm('Tem certeza que deseja sair?')) {
            authManager.logout();
          }
        });
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

      // Botão exportar PDF será anexado pelo módulo pdf.js
      
      console.log('✅ Eventos anexados com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao anexar eventos:', error);
    }
  }

  loadPatient() {
    try {
      const raw = localStorage.getItem('taco_patient_v1');
      if (raw) {
        const p = JSON.parse(raw);
        state.patient = { ...state.patient, ...p };
        console.log('📁 Paciente carregado do localStorage:', p.nome);
      } else {
        console.log('ℹ️ Nenhum paciente salvo no localStorage');
      }
    } catch (e) {
      console.warn('⚠️ Erro ao carregar paciente do localStorage:', e);
    }
  }

  setupAuthListener() {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Mudança de estado de autenticação:', event);
      
      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            authManager.isAuthenticated = true;
            authManager.currentUser = session.user;
            this.currentUser = session.user;
            
            if (!this.isInitialized) {
              await this.showMainApp();
            }
          }
          break;
          
        case 'SIGNED_OUT':
          authManager.isAuthenticated = false;
          authManager.currentUser = null;
          this.currentUser = null;
          this.isInitialized = false;
          
          // Limpar estado da aplicação
          state.patient = {
            id: null,
            nome: 'Paciente Exemplo',
            data_nascimento: '',
            genero: '',
            cpf: '',
            telefone: '',
            email: '',
            tags: [],
            observacoes: ''
          };
          
          MEALS.forEach(m => state.meals[m] = []);
          
          authManager.showLogin();
          break;
          
        case 'USER_UPDATED':
          console.log('👤 Usuário atualizado:', session?.user?.email);
          break;
          
        case 'TOKEN_REFRESHED':
          console.log('🔄 Token atualizado');
          break;
          
        default:
          console.log('ℹ️ Evento de auth não tratado:', event);
      }
    });
  }

  // Método para recarregar a aplicação se necessário
  async reload() {
    console.log('🔄 Recarregando aplicação...');
    this.isInitialized = false;
    await this.showMainApp();
  }
}

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 DOM carregado, iniciando aplicação...');
  
  try {
    const app = new App();
    await app.init();
    
    // Exportar para debugging
    window.app = app;
    window.authManager = authManager;
    window.appState = state;
    
    console.log('🎉 Aplicação inicializada com sucesso!');
    
  } catch (error) {
    console.error('💥 Erro fatal na inicialização:', error);
    
    // Fallback: mostrar mensagem de erro
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center;">
          <div>
            <div style="font-size: 4rem; margin-bottom: 1rem;">😵</div>
            <h1 style="margin-bottom: 1rem;">Erro ao Carregar</h1>
            <p style="margin-bottom: 2rem; opacity: 0.8;">Ocorreu um erro ao inicializar a aplicação.</p>
            <button onclick="location.reload()" style="background: white; color: #667eea; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
              🔄 Tentar Novamente
            </button>
          </div>
        </div>
      `;
    }
  }
});

// Exportar para uso em outros módulos
export default App;
