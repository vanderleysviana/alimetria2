// src/dietBuilder.js - VERIFICAÇÃO DE IMPORTAÇÕES
import { state, MEALS, selectPatient, clearCurrentPatient } from './state.js';
import { openAddFoodModal } from './modals.js';
import { savePatientToPdfContext } from './pdf.js';
import { saveCurrentDiet } from './patientDiets.js'; // ← Esta importação deve funcionar agora

export function showDietBuilder() {
  const app = document.getElementById('app');
  
  if (!state.currentPatient) {
    showDashboard();
    return;
  }

  app.innerHTML = `
    <div class="diet-builder">
      <!-- Header -->
      <header class="diet-header">
        <div class="patient-info">
          <button class="btn btn-back" onclick="showDashboard()">
            ← Voltar ao Painel
          </button>
          <div class="patient-details">
            <h1>🍽️ Montador de Dietas</h1>
            <div class="patient-selected">
              <strong>Paciente:</strong> ${state.currentPatient.nome}
              ${state.currentPatient.idade ? ` • ${state.currentPatient.idade} anos` : ''}
              ${state.currentPatient.genero ? ` • ${state.currentPatient.genero}` : ''}
            </div>
          </div>
        </div>
        <div class="diet-actions">
          <button id="saveDietBtn" class="btn btn-success">
            💾 Salvar Dieta
          </button>
          <button id="exportPdfBtn" class="btn btn-primary">
            📄 Exportar PDF
          </button>
          <button id="clearAllBtn" class="btn btn-danger">
            🗑️ Limpar Tudo
          </button>
        </div>
      </header>

      <!-- Status Message -->
      <div id="dietStatusMessage" class="status-message" style="display:none"></div>

      <!-- Main Content -->
      <main class="diet-content">
        <!-- Summary Panel -->
        <div class="summary-panel">
          <div class="summary-header">
            <h3>📊 Resumo Nutricional</h3>
            <div class="summary-stats" id="summaryStats">
              <div class="loading">Calculando...</div>
            </div>
          </div>
          <div class="nutrition-grid" id="nutritionGrid"></div>
          <div class="nutrition-alerts" id="nutritionAlerts"></div>
        </div>

        <!-- Meals Container -->
        <div class="meals-container">
          ${MEALS.map(meal => `
            <div class="meal-section" id="meal-${meal}">
              <div class="meal-header">
                <h3>${meal}</h3>
                <button class="btn btn-sm btn-primary" onclick="openAddFoodModal('${meal}')">
                  + Adicionar Alimento
                </button>
              </div>
              <div class="food-list" id="foodList-${meal}">
                <div class="empty-meal">
                  <div class="empty-icon">🥗</div>
                  <p>Nenhum alimento adicionado</p>
                  <button class="btn btn-sm btn-outline" onclick="openAddFoodModal('${meal}')">
                    Adicionar primeiro alimento
                  </button>
                </div>
              </div>
              <div class="meal-totals" id="mealTotals-${meal}"></div>
            </div>
          `).join('')}
        </div>
      </main>
    </div>
  `;

  // Anexar eventos
  attachDietBuilderEvents();
  
  // Renderizar dados iniciais
  renderDietData();
}

function attachDietBuilderEvents() {
  // Botão salvar dieta - CORRIGIDO para usar saveCurrentDiet
  document.getElementById('saveDietBtn').addEventListener('click', saveCurrentDiet);
  
  // Botão exportar PDF
  document.getElementById('exportPdfBtn').addEventListener('click', savePatientToPdfContext);
  
  // Botão limpar tudo
  document.getElementById('clearAllBtn').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja limpar todas as refeições?')) {
      MEALS.forEach(m => state.meals[m] = []);
      state.unsavedChanges = false;
      renderDietData();
    }
  });
}

// ... (o resto das funções do dietBuilder permanecem iguais)

function renderDietData() {
  renderMealLists();
  renderNutritionSummary();
  updateStatusMessage();
}

function renderMealLists() {
  MEALS.forEach(mealName => {
    const listContainer = document.getElementById(`foodList-${mealName}`);
    const totalsContainer = document.getElementById(`mealTotals-${mealName}`);
    
    const foods = state.meals[mealName] || [];
    
    if (foods.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-meal">
          <div class="empty-icon">🥗</div>
          <p>Nenhum alimento adicionado</p>
          <button class="btn btn-sm btn-outline" onclick="openAddFoodModal('${mealName}')">
            Adicionar primeiro alimento
          </button>
        </div>
      `;
      totalsContainer.innerHTML = '';
      return;
    }
    
    // Renderizar lista de alimentos
    const foodsHtml = foods.map((item, index) => {
      const food = state.taco[item.id] || { name: 'Alimento desconhecido', calorias: 0, proteina: 0, carboidrato: 0, lipidio: 0, fibra: 0 };
      const calories = (food.calorias * item.qty) / 100;
      const protein = (food.proteina * item.qty) / 100;
      const carbs = (food.carboidrato * item.qty) / 100;
      const fat = (food.lipidio * item.qty) / 100;
      
      return `
        <div class="food-item">
          <div class="food-info">
            <div class="food-name">${food.name}</div>
            <div class="food-quantity">${item.qty}g</div>
          </div>
          <div class="food-nutrition">
            <span class="nutrition-badge">${calories.toFixed(0)} kcal</span>
            <span class="nutrition-badge">P: ${protein.toFixed(1)}g</span>
            <span class="nutrition-badge">C: ${carbs.toFixed(1)}g</span>
            <span class="nutrition-badge">L: ${fat.toFixed(1)}g</span>
          </div>
          <div class="food-actions">
            <button class="btn btn-sm btn-danger" onclick="removeFood('${mealName}', ${index})">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    listContainer.innerHTML = foodsHtml;
    
    // Calcular totais da refeição
    const mealTotal = calculateMealTotal(mealName);
    totalsContainer.innerHTML = `
      <div class="meal-summary">
        <strong>Total da refeição:</strong>
        ${mealTotal.calorias.toFixed(0)} kcal • 
        P: ${mealTotal.proteina.toFixed(1)}g • 
        C: ${mealTotal.carboidrato.toFixed(1)}g • 
        L: ${mealTotal.lipidio.toFixed(1)}g
      </div>
    `;
  });
}

function calculateMealTotal(mealName) {
  const foods = state.meals[mealName] || [];
  const total = { calorias: 0, proteina: 0, carboidrato: 0, lipidio: 0, fibra: 0 };
  
  foods.forEach(item => {
    const food = state.taco[item.id] || {};
    total.calorias += (food.calorias || 0) * item.qty / 100;
    total.proteina += (food.proteina || 0) * item.qty / 100;
    total.carboidrato += (food.carboidrato || 0) * item.qty / 100;
    total.lipidio += (food.lipidio || 0) * item.qty / 100;
    total.fibra += (food.fibra || 0) * item.qty / 100;
  });
  
  return total;
}

function renderNutritionSummary() {
  const total = calculateTotalNutrition();
  const statsContainer = document.getElementById('summaryStats');
  const gridContainer = document.getElementById('nutritionGrid');
  const alertsContainer = document.getElementById('nutritionAlerts');
  
  // Estatísticas rápidas
  statsContainer.innerHTML = `
    <div class="stat-badge">${total.calorias.toFixed(0)} kcal</div>
    <div class="stat-badge">${total.proteina.toFixed(1)}g proteína</div>
    <div class="stat-badge">${total.carboidrato.toFixed(1)}g carboidratos</div>
    <div class="stat-badge">${total.lipidio.toFixed(1)}g lipídios</div>
  `;
  
  // Grid nutricional detalhado
  gridContainer.innerHTML = `
    <div class="nutrition-item">
      <div class="nutrition-label">Energia Total</div>
      <div class="nutrition-value">${total.calorias.toFixed(0)} kcal</div>
    </div>
    <div class="nutrition-item">
      <div class="nutrition-label">Proteínas</div>
      <div class="nutrition-value">${total.proteina.toFixed(1)} g</div>
    </div>
    <div class="nutrition-item">
      <div class="nutrition-label">Carboidratos</div>
      <div class="nutrition-value">${total.carboidrato.toFixed(1)} g</div>
    </div>
    <div class="nutrition-item">
      <div class="nutrition-label">Lipídios</div>
      <div class="nutrition-value">${total.lipidio.toFixed(1)} g</div>
    </div>
    <div class="nutrition-item">
      <div class="nutrition-label">Fibras</div>
      <div class="nutrition-value">${total.fibra.toFixed(1)} g</div>
    </div>
  `;
  
  // Alertas nutricionais
  const alerts = generateNutritionAlerts(total);
  if (alerts.length > 0) {
    alertsContainer.innerHTML = alerts.map(alert => `
      <div class="alert alert-warning">
        ⚠️ ${alert}
      </div>
    `).join('');
  } else {
    alertsContainer.innerHTML = '<div class="alert alert-success">✓ Perfil nutricional adequado</div>';
  }
}

function calculateTotalNutrition() {
  const total = { calorias: 0, proteina: 0, carboidrato: 0, lipidio: 0, fibra: 0 };
  
  MEALS.forEach(mealName => {
    const mealTotal = calculateMealTotal(mealName);
    Object.keys(total).forEach(key => {
      total[key] += mealTotal[key];
    });
  });
  
  return total;
}

function generateNutritionAlerts(total) {
  const alerts = [];
  
  if (total.calorias < 1200) alerts.push('Baixa ingestão calórica');
  if (total.calorias > 3000) alerts.push('Alta ingestão calórica');
  if (total.proteina < 50) alerts.push('Proteína insuficiente');
  if (total.proteina > 150) alerts.push('Excesso de proteína');
  if (total.fibra < 25) alerts.push('Fibras insuficientes');
  
  // Verificar refeições vazias
  MEALS.forEach(meal => {
    if ((state.meals[meal] || []).length === 0) {
      alerts.push(`Refeição vazia: ${meal}`);
    }
  });
  
  return alerts;
}

function updateStatusMessage() {
  const statusEl = document.getElementById('dietStatusMessage');
  if (!statusEl) return;
  
  if (state.unsavedChanges) {
    statusEl.textContent = '⚠️ Você tem alterações não salvas';
    statusEl.className = 'status-message status-warning';
    statusEl.style.display = 'block';
  } else {
    statusEl.style.display = 'none';
  }
}

// Funções globais para o diet builder
window.removeFood = (mealName, index) => {
  state.meals[mealName].splice(index, 1);
  state.unsavedChanges = true;
  renderDietData();
};

window.showDashboard = () => {
  if (state.unsavedChanges) {
    if (!confirm('Você tem alterações não salvas. Deseja realmente voltar ao painel?')) {
      return;
    }
  }
  // Precisamos importar showDashboard ou usar uma abordagem diferente
  window.location.reload(); // Solução temporária
};
