// src/ui.js - VERSÃO CORRIGIDA COM EXIBIÇÃO DE ALIMENTOS FUNCIONANDO
import { state, MEALS, formatNumber, calcScaled, isAppReady } from './state.js';
import { openAddFoodModal } from './modals.js';
import { savePatientToPdfContext } from './pdf.js';
import { saveCurrentSessionAsDiet, saveEditingDiet } from './patientDiets.js';

// Sistema de eventos para notificar quando a aplicação estiver pronta
let appReady = false;
const readyCallbacks = [];

export function onAppReady(callback) {
  if (appReady) {
    callback();
  } else {
    readyCallbacks.push(callback);
  }
}

export function notifyAppReady() {
  appReady = true;
  readyCallbacks.forEach(callback => callback());
  readyCallbacks.length = 0; // Limpar array
}

// Render / UI helpers
export function createMealCard(mealName){
  const card = document.createElement('div'); 
  card.className = 'meal-card';
  const header = document.createElement('div'); 
  header.className='meal-header';
  const title = document.createElement('strong'); 
  title.textContent=mealName;
  const btns = document.createElement('div');
  const addBtn = document.createElement('button'); 
  addBtn.className='btn btn-primary'; 
  addBtn.innerHTML = '+ alimento';
  addBtn.onclick = ()=> openAddFoodModal(mealName);
  btns.appendChild(addBtn);
  header.appendChild(title); 
  header.appendChild(btns);
  const list = document.createElement('div'); 
  list.className='food-list'; 
  list.id = `list-${mealName}`;
  const totals = document.createElement('div'); 
  totals.className='totals'; 
  totals.id=`totals-${mealName}`;
  card.appendChild(header); 
  card.appendChild(list); 
  card.appendChild(totals);
  return card;
}

export function renderMeals(){
  console.log('🔄 Renderizando refeições...', state.meals);
  
  // Verificar se a aplicação está pronta
  if (!isAppReady()) {
    console.log('⏳ Aplicação ainda não carregou, aguardando...');
    setTimeout(renderMeals, 100);
    return;
  }

  const container = document.getElementById('mealsContainer');
  
  if (!container) {
    console.log('⏳ Container de refeições não encontrado, aguardando...');
    return;
  }

  container.innerHTML='';

  // Determine if we are allowed to edit: allow when a patient is selected
  const canEdit = !!state.currentPatient;

  if(!canEdit){
    const empty = document.createElement('div');
    empty.style.padding='24px';
    empty.style.textAlign='center';
    empty.style.color='#334155';
    empty.style.fontSize='15px';
    empty.textContent = 'Selecione um paciente para começar a montar dietas.';
    container.appendChild(empty);
    // hide FAB if present
    const fab = document.getElementById('saveDietFloating'); 
    if(fab) fab.style.display='none';
    return;
  }

  // show header info inside page for clarity when editing
  const headerInfo = document.createElement('div');
  headerInfo.style.display='flex';
  headerInfo.style.justifyContent='space-between';
  headerInfo.style.alignItems='center';
  headerInfo.style.marginBottom='8px';
  const left = document.createElement('div');
  left.innerHTML = `<strong style="color:var(--dark)">${state.currentPatient?.nome || 'Paciente'}</strong><div style="font-size:12px;color:#334155">${state.currentDiet ? `Editando: ${state.currentDiet.name||''}` : 'Nova dieta'}</div>`;
  headerInfo.appendChild(left);
  const right = document.createElement('div'); 
  right.className='controls';
  headerInfo.appendChild(right);
  container.appendChild(headerInfo);

  MEALS.forEach(m=>{
    const card = createMealCard(m);
    container.appendChild(card);
    renderMealList(m);
  });
  renderSummary();
}

export function renderMealList(mealName){
  const list = document.getElementById(`list-${mealName}`);
  if (!list) {
    console.log(`❌ Lista não encontrada: list-${mealName}`);
    return;
  }
  
  list.innerHTML=''; 
  const foods = state.meals[mealName] || [];
  
  console.log(`📋 Renderizando ${foods.length} alimentos para ${mealName}`, foods);

  if (foods.length === 0) {
    list.innerHTML = `
      <div class="empty-meal">
        <div class="empty-icon">🥗</div>
        <p>Nenhum alimento adicionado</p>
        <button class="btn btn-sm btn-outline" onclick="openAddFoodModal('${mealName}')">
          Adicionar primeiro alimento
        </button>
      </div>
    `;
    return;
  }
  
  foods.forEach((item, index)=>{
    console.log(`🍎 Processando alimento ${index}:`, item);
    
    // BUSCAR SEMPRE NO state.taco - não confiar em foodData
    const food = state.taco[item.id] || { 
      name: 'Alimento não encontrado', 
      calorias: 0, 
      proteina: 0, 
      carboidrato: 0, 
      lipidio: 0, 
      fibra: 0 
    };
    
    console.log(`📊 Dados do alimento encontrado:`, food);
    
    const row = document.createElement('div'); 
    row.className='food-item';
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.padding = '12px';
    row.style.background = '#f8fafc';
    row.style.borderRadius = '8px';
    row.style.marginBottom = '8px';
    row.style.borderLeft = '4px solid #10b981';
    
    const left = document.createElement('div'); 
    left.innerHTML = `
      <div style="font-weight:600;color:#1e293b">${food.name}</div>
      <div style="font-size:12px;color:#475569">${item.qty} g</div>
    `;
    
    const right = document.createElement('div'); 
    right.style.display = 'flex'; 
    right.style.gap = '12px'; 
    right.style.alignItems = 'center';
    right.style.flexDirection = 'column';
    right.style.alignItems = 'flex-end';
    
    // Linha principal de nutrientes
    const nutrDiv = document.createElement('div'); 
    nutrDiv.style.fontSize = '12px'; 
    nutrDiv.style.color = '#0f172a';
    nutrDiv.style.textAlign = 'right';
    nutrDiv.innerHTML = `
      <strong>${formatNumber(calcScaled(food.calorias, item.qty),0)} kcal</strong> • 
      P:${formatNumber(calcScaled(food.proteina, item.qty))}g • 
      C:${formatNumber(calcScaled(food.carboidrato, item.qty))}g • 
      L:${formatNumber(calcScaled(food.lipidio, item.qty))}g
    `;
    
    // Linha secundária com mais nutrientes
    const extraNutrDiv = document.createElement('div');
    extraNutrDiv.style.fontSize = '11px';
    extraNutrDiv.style.color = '#64748b';
    extraNutrDiv.style.textAlign = 'right';
    
    const extraNutrients = [];
    if (food.fibra || food.fibra_alimentar) {
      const fibraVal = food.fibra || food.fibra_alimentar;
      extraNutrients.push(`Fib:${formatNumber(calcScaled(fibraVal, item.qty))}g`);
    }
    if (food.colesterol && calcScaled(food.colesterol, item.qty) > 0) {
      extraNutrients.push(`Col:${formatNumber(calcScaled(food.colesterol, item.qty))}mg`);
    }
    if (food.sodio && calcScaled(food.sodio, item.qty) > 0) {
      extraNutrients.push(`Na:${formatNumber(calcScaled(food.sodio, item.qty))}mg`);
    }
    
    extraNutrDiv.textContent = extraNutrients.join(' • ');
    
    const del = document.createElement('button'); 
    del.className = 'btn btn-danger btn-sm'; 
    del.textContent = 'Remover';
    del.style.padding = '4px 8px';
    del.style.fontSize = '11px';
    del.onclick = ()=>{ 
      console.log(`🗑️ Removendo alimento ${index} de ${mealName}`);
      state.meals[mealName] = state.meals[mealName].filter((_, i) => i !== index);
      state.unsavedChanges = true; 
      renderMealList(mealName); 
      renderSummary(); 
    };
    
    right.appendChild(nutrDiv);
    if (extraNutrients.length > 0) {
      right.appendChild(extraNutrDiv);
    }
    right.appendChild(del);
    
    row.appendChild(left); 
    row.appendChild(right);
    list.appendChild(row);
  });
  
  const totalsEl = document.getElementById(`totals-${mealName}`);
  if (totalsEl) {
    totalsEl.innerHTML=''; 
    const sum = aggregateMeal(mealName);
    totalsEl.innerHTML = `
      <div style="font-weight:600;color:#063970; padding: 8px; background: #dbeafe; border-radius: 6px; margin-top: 8px;">
        🔍 Totais da refeição: ${formatNumber(sum.calorias,0)} kcal • 
        P:${formatNumber(sum.proteina)}g • 
        C:${formatNumber(sum.carboidrato)}g • 
        L:${formatNumber(sum.lipidio)}g • 
        Fib:${formatNumber(sum.fibra)}g
      </div>
    `;
  }
}

export function aggregateMeal(mealName){
  const foods = state.meals[mealName] || [];
  const total = {
    calorias:0,
    proteina:0,
    carboidrato:0,
    lipidio:0,
    fibra:0,
    colesterol:0,
    sodio:0,
    potassio:0,
    calcio:0,
    ferro:0
  };
  
  foods.forEach(item=>{
    const f = state.taco[item.id] || {};
    console.log(`📊 Calculando totais para:`, f.name, 'Qtd:', item.qty);
    
    total.calorias += calcScaled(f.calorias||0, item.qty);
    total.proteina += calcScaled(f.proteina||0, item.qty);
    total.carboidrato += calcScaled(f.carboidrato||0, item.qty);
    total.lipidio += calcScaled(f.lipidio||0, item.qty);
    total.fibra += calcScaled(f.fibra||f.fibra_alimentar||0, item.qty || 0);
    total.colesterol += calcScaled(f.colesterol||0, item.qty);
    total.sodio += calcScaled(f.sodio||0, item.qty);
    total.potassio += calcScaled(f.potassio||0, item.qty);
    total.calcio += calcScaled(f.calcio||0, item.qty);
    total.ferro += calcScaled(f.ferro||0, item.qty);
  });
  
  console.log(`🧮 Totais calculados para ${mealName}:`, total);
  return total;
}

export function aggregateAll(){
  const total = {
    calorias:0,
    proteina:0,
    carboidrato:0,
    lipidio:0,
    fibra:0,
    colesterol:0,
    sodio:0,
    potassio:0,
    calcio:0,
    ferro:0
  };
  
  MEALS.forEach(m=>{
    const t = aggregateMeal(m);
    Object.keys(t).forEach(k=> total[k] = (total[k]||0) + t[k]);
  });
  
  console.log('📈 Totais gerais:', total);
  return total;
}

export function renderSummary(){
  if (!isAppReady()) {
    setTimeout(renderSummary, 100);
    return;
  }

  const details = document.getElementById('summaryDetails');
  const alerts = document.getElementById('alerts');
  
  if (!details || !alerts) {
    return;
  }
  
  const sum = aggregateAll();
  details.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; width: 100%;">
      <div style="text-align: center; padding: 12px; background: #1e40af; color: white; border-radius: 8px;">
        <div style="font-size: 12px; opacity: 0.9;">Calorias</div>
        <div style="font-size: 18px; font-weight: bold;">${formatNumber(sum.calorias,0)}</div>
        <div style="font-size: 11px;">kcal</div>
      </div>
      <div style="text-align: center; padding: 12px; background: #2563eb; color: white; border-radius: 8px;">
        <div style="font-size: 12px; opacity: 0.9;">Proteínas</div>
        <div style="font-size: 18px; font-weight: bold;">${formatNumber(sum.proteina)}</div>
        <div style="font-size: 11px;">gramas</div>
      </div>
      <div style="text-align: center; padding: 12px; background: #3b82f6; color: white; border-radius: 8px;">
        <div style="font-size: 12px; opacity: 0.9;">Carboidratos</div>
        <div style="font-size: 18px; font-weight: bold;">${formatNumber(sum.carboidrato)}</div>
        <div style="font-size: 11px;">gramas</div>
      </div>
      <div style="text-align: center; padding: 12px; background: #60a5fa; color: white; border-radius: 8px;">
        <div style="font-size: 12px; opacity: 0.9;">Lipídios</div>
        <div style="font-size: 18px; font-weight: bold;">${formatNumber(sum.lipidio)}</div>
        <div style="font-size: 11px;">gramas</div>
      </div>
      <div style="text-align: center; padding: 12px; background: #93c5fd; color: #1e293b; border-radius: 8px;">
        <div style="font-size: 12px; opacity: 0.9;">Fibras</div>
        <div style="font-size: 18px; font-weight: bold;">${formatNumber(sum.fibra)}</div>
        <div style="font-size: 11px;">gramas</div>
      </div>
    </div>
  `;

  // Botão flutuante de salvar dieta
  let floating = document.getElementById('saveDietFloating');
  if(!floating){
    floating = document.createElement('button');
    floating.id = 'saveDietFloating';
    floating.textContent = '💾 Salvar Dieta';
    floating.className = 'btn btn-success';
    floating.style.position = 'fixed';
    floating.style.bottom = '20px';
    floating.style.right = '20px';
    floating.style.zIndex = '1000';
    floating.style.padding = '12px 20px';
    floating.style.fontSize = '14px';
    floating.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    floating.onclick = ()=> {
      console.log('💾 Clicou para salvar dieta');
      saveEditingDiet();
    };
    document.body.appendChild(floating);
  }
  
  if(state.currentPatient){
    floating.style.display = 'inline-block';
  }else{
    floating.style.display = 'none';
  }

  // Botão salvar sessão atual
  const controls = document.querySelector('.summary .controls') || document.querySelector('.controls');
  if(controls){
    let saveSessionMain = document.getElementById('saveSessionMainBtn');
    if(!saveSessionMain){
      saveSessionMain = document.createElement('button');
      saveSessionMain.id = 'saveSessionMainBtn';
      saveSessionMain.className = 'btn btn-success';
      saveSessionMain.style.marginRight = '8px';
      saveSessionMain.textContent = '💾 Salvar sessão atual como dieta';
      saveSessionMain.onclick = ()=>{
        if(!state.currentPatient || !state.currentPatient.id){
          alert('Selecione primeiro um paciente para salvar a sessão como dieta.');
          return;
        }
        console.log('💾 Salvando sessão atual como dieta...');
        saveCurrentSessionAsDiet(state.currentPatient.id);
      };
      controls.insertBefore(saveSessionMain, controls.firstChild);
    }
    if(state.currentPatient && state.currentPatient.id && !state.currentDiet){
      saveSessionMain.style.display = 'inline-block';
    }else{
      saveSessionMain.style.display = 'none';
    }
  }

  alerts.innerHTML=''; 
  if(sum.proteina < 50) addAlert('⚡ Baixa ingestão de proteínas.');
  if(sum.carboidrato > 350) addAlert('🍚 Excesso de carboidratos.');
  if(sum.calorias > 3000) addAlert('🔥 Calorias acima do recomendado.');
  if(sum.fibra < 25) addAlert('🥬 Fibras insuficientes.');
  if(sum.sodio > 2300) addAlert('🧂 Sódio acima do recomendado.');
  if(sum.colesterol > 300) addAlert('❤️ Colesterol acima do recomendado.');
  
  MEALS.forEach(m=>{
    if((state.meals[m] || []).length===0) addAlert(`🍽️ Refeição vazia: ${m}`);
  });
  
  function addAlert(text){
    const a = document.createElement('div'); 
    a.className='alert alert-warning'; 
    a.style.display = 'flex';
    a.style.alignItems = 'center';
    a.style.gap = '8px';
    a.style.marginBottom = '8px';
    a.textContent=text;
    alerts.appendChild(a);
  }
}

export function initUI() {
  console.log('🎨 Inicializando UI...');
  
  const exportBtn = document.getElementById('exportPdfBtn');
  if(exportBtn) {
    exportBtn.addEventListener('click', () => {
      console.log('📄 Exportando PDF...');
      savePatientToPdfContext();
    });
  }
  
  const clearBtn = document.getElementById('clearBtn');
  if(clearBtn) {
    clearBtn.addEventListener('click', ()=>{
      if(!confirm('Limpar todas as refeições? Esta ação não pode ser desfeita.')) return;
      console.log('🗑️ Limpando todas as refeições...');
      MEALS.forEach(m=> state.meals[m]=[]);
      state.unsavedChanges = true;
      renderMeals();
    });
  }

  // Atualizar header do paciente
  setInterval(()=>{
    const obs = document.getElementById('patientDisplay');
    if(!obs) return;
    if(state.unsavedChanges){
      if(!obs.textContent.includes(' • Alterações não salvas')) {
        obs.textContent = (state.currentPatient?.nome? `${state.currentPatient.nome} — ${state.currentDiet ? state.currentDiet.name||'' : ''}`.trim() : '— nenhum paciente selecionado —') + ' • ⚡ Alterações não salvas';
      }
    }else{
      if(state.currentPatient && state.currentPatient.nome){
        obs.textContent = state.currentDiet ? `${state.currentPatient.nome} — ${state.currentDiet.name||''}` : `${state.currentPatient.nome} — ${state.currentPatient.objetivo||''}`;
      }else{
        obs.textContent = '— nenhum paciente selecionado —';
      }
    }
  },500);

  // Renderizar inicialmente
  if (isAppReady()) {
    renderMeals();
  } else {
    console.log('⏳ UI: Aguardando aplicação ficar pronta...');
    const checkInterval = setInterval(() => {
      if (isAppReady()) {
        clearInterval(checkInterval);
        renderMeals();
      }
    }, 100);
  }
  
  console.log('✅ UI inicializada com sucesso');
}

// Adicionar funções globais para uso em eventos
window.openAddFoodModal = openAddFoodModal;
