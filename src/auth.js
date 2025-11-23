// src/auth.js - SISTEMA COMPLETO DE AUTENTICAÇÃO
import supabase from './supabase.js';

export class AuthManager {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
  }

  // Mostrar tela de login
  showLogin() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    app.style.minHeight = '100vh';
    app.style.display = 'flex';
    app.style.alignItems = 'center';
    app.style.justifyContent = 'center';

    const loginContainer = document.createElement('div');
    loginContainer.style.background = 'white';
    loginContainer.style.padding = '2rem';
    loginContainer.style.borderRadius = '12px';
    loginContainer.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
    loginContainer.style.width = '100%';
    loginContainer.style.maxWidth = '400px';

    loginContainer.innerHTML = `
      <div style="text-align: center; margin-bottom: 2rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🍎</div>
        <h1 style="color: #333; margin-bottom: 0.5rem;">Sistema Nutricional</h1>
        <p style="color: #666; margin-bottom: 2rem;">Área do Nutricionista</p>
      </div>

      <div id="authTabs" style="display: flex; margin-bottom: 1.5rem; border-bottom: 2px solid #f0f0f0;">
        <button id="loginTab" class="auth-tab active" style="flex: 1; padding: 12px; border: none; background: none; font-weight: 600; color: #4f46e5; border-bottom: 2px solid #4f46e5;">
          Entrar
        </button>
        <button id="signupTab" class="auth-tab" style="flex: 1; padding: 12px; border: none; background: none; font-weight: 500; color: #666;">
          Cadastrar
        </button>
      </div>

      <form id="authForm">
        <div style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; color: #333; font-weight: 500;">Email</label>
          <input type="email" id="email" required 
                 style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
        </div>

        <div style="margin-bottom: 1.5rem;">
          <label style="display: block; margin-bottom: 0.5rem; color: #333; font-weight: 500;">Senha</label>
          <input type="password" id="password" required 
                 style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
        </div>

        <div id="confirmPasswordField" style="margin-bottom: 1.5rem; display: none;">
          <label style="display: block; margin-bottom: 0.5rem; color: #333; font-weight: 500;">Confirmar Senha</label>
          <input type="password" id="confirmPassword" 
                 style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
        </div>

        <button type="submit" id="submitBtn" 
                style="width: 100%; padding: 12px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-bottom: 1rem;">
          Entrar
        </button>

        <div id="authMessage" style="text-align: center; color: #dc2626; font-size: 14px; min-height: 20px;"></div>
      </form>
    `;

    app.appendChild(loginContainer);
    this.attachAuthEvents();
  }

  // Anexar eventos de autenticação
  attachAuthEvents() {
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const authForm = document.getElementById('authForm');
    const confirmPasswordField = document.getElementById('confirmPasswordField');
    const submitBtn = document.getElementById('submitBtn');
    const authMessage = document.getElementById('authMessage');

    // Alternar entre login e cadastro
    loginTab.addEventListener('click', () => {
      loginTab.classList.add('active');
      loginTab.style.color = '#4f46e5';
      loginTab.style.fontWeight = '600';
      loginTab.style.borderBottom = '2px solid #4f46e5';
      
      signupTab.classList.remove('active');
      signupTab.style.color = '#666';
      signupTab.style.fontWeight = '500';
      signupTab.style.borderBottom = 'none';
      
      confirmPasswordField.style.display = 'none';
      submitBtn.textContent = 'Entrar';
      authMessage.textContent = '';
    });

    signupTab.addEventListener('click', () => {
      signupTab.classList.add('active');
      signupTab.style.color = '#4f46e5';
      signupTab.style.fontWeight = '600';
      signupTab.style.borderBottom = '2px solid #4f46e5';
      
      loginTab.classList.remove('active');
      loginTab.style.color = '#666';
      loginTab.style.fontWeight = '500';
      loginTab.style.borderBottom = 'none';
      
      confirmPasswordField.style.display = 'block';
      submitBtn.textContent = 'Cadastrar';
      authMessage.textContent = '';
    });

    // Submissão do formulário
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const isSignup = signupTab.classList.contains('active');

      // Validações
      if (!email || !password) {
        authMessage.textContent = 'Preencha todos os campos obrigatórios.';
        return;
      }

      if (isSignup && password !== confirmPassword) {
        authMessage.textContent = 'As senhas não coincidem.';
        return;
      }

      if (password.length < 6) {
        authMessage.textContent = 'A senha deve ter pelo menos 6 caracteres.';
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = isSignup ? 'Cadastrando...' : 'Entrando...';

        let result;
        if (isSignup) {
          result = await supabase.auth.signUp({
            email,
            password,
          });
        } else {
          result = await supabase.auth.signInWithPassword({
            email,
            password,
          });
        }

        if (result.error) {
          throw result.error;
        }

        if (isSignup && result.data.user) {
          authMessage.style.color = '#059669';
          authMessage.textContent = 'Cadastro realizado! Verifique seu email para confirmar a conta.';
          // Volta para a tela de login após cadastro
          setTimeout(() => loginTab.click(), 2000);
        }

        submitBtn.disabled = false;
        submitBtn.textContent = isSignup ? 'Cadastrar' : 'Entrar';

      } catch (error) {
        console.error('Erro de autenticação:', error);
        authMessage.textContent = this.getAuthErrorMessage(error);
        submitBtn.disabled = false;
        submitBtn.textContent = isSignup ? 'Cadastrar' : 'Entrar';
      }
    });
  }

  // Traduzir mensagens de erro do Supabase
  getAuthErrorMessage(error) {
    const messages = {
      'Invalid login credentials': 'Email ou senha incorretos.',
      'Email not confirmed': 'Confirme seu email antes de fazer login.',
      'User already registered': 'Este email já está cadastrado.',
      'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
      'To signup, please provide your email': 'Forneça um email válido.',
    };

    return messages[error.message] || error.message || 'Erro na autenticação. Tente novamente.';
  }

  // Verificar autenticação atual
  async checkAuth() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session) {
        this.isAuthenticated = true;
        this.currentUser = session.user;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  }

  // Fazer logout
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      this.isAuthenticated = false;
      this.currentUser = null;
      this.showLogin();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  // Obter usuário atual
  getCurrentUser() {
    return this.currentUser;
  }
}

export const authManager = new AuthManager();
