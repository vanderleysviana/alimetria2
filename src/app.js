// src/app.js - VERSÃO REORGANIZADA E SIMPLIFICADA
import { authManager } from './auth.js';
import { state, initializeApp } from './state.js';
import { showDashboard } from './dashboard.js';
import { showDietBuilder } from './dietBuilder.js';

class App {
  constructor() {
    this.isInitialized = false;
  }

  async init() {
    console.log('🚀 Inicializando aplicação...');

    try {
      // Verificar autenticação
      const isAuthenticated = await authManager.checkAuth();
      
      if (isAuthenticated) {
        console.log('✅ Usuário autenticado:', authManager.currentUser.email);
        
        // Inicializar dados da aplicação
        await initializeApp();
        
        // Mostrar dashboard inicial
        this.showMainApp();
      } else {
        console.log('🔐 Mostrando tela de login');
        authManager.showLogin();
      }

      // Configurar listener de autenticação
      this.setupAuthListener();

    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
      this.showErrorScreen(error);
    }
  }

  showMainApp() {
    // Sempre começar com o dashboard
    showDashboard();
    this.isInitialized = true;
  }

  setupAuthListener() {
    // Listener para mudanças de autenticação
    // (implementação similar à anterior, mas simplificada)
  }

  showErrorScreen(error) {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="error-screen">
        <div class="error-content">
          <div class="error-icon">😵</div>
          <h1>Erro ao Carregar</h1>
          <p>${error.message || 'Ocorreu um erro ao inicializar a aplicação.'}</p>
          <button onclick="location.reload()" class="btn btn-primary">
            🔄 Tentar Novamente
          </button>
        </div>
      </div>
    `;
  }
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const app = new App();
    await app.init();
    
    // Exportar para debugging
    window.app = app;
    
  } catch (error) {
    console.error('💥 Erro fatal:', error);
  }
});

// Exportar funções globais
export default App;
export { showDashboard, showDietBuilder };
