// src/anthropometry.js - SISTEMA COMPLETO DE ANTROPOMETRIA
import supabase, { ensureAuth } from './supabase.js';
import { state } from './state.js';

export async function openAnthropometryForm(consultationId, patientId, existingData = null) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = '';
  
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '800px';
  modal.style.width = '95%';

  const title = document.createElement('h3');
  title.textContent = '📏 Dados Antropométricos';
  title.style.color = '#1565C0';
  title.style.marginBottom = '24px';
  modal.appendChild(title);

  const form = document.createElement('form');
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = '16px';

  // Campos de antropometria
  const campos = [
    { label: 'Peso (kg)', type: 'number', id: 'anth_peso', step: '0.1', value: existingData?.peso || '' },
    { label: 'Altura (m)', type: 'number', id: 'anth_altura', step: '0.01', value: existingData?.altura || '' },
    { label: 'Circunferência do Pescoço (cm)', type: 'number', id: 'anth_pescoco', step: '0.1', value: existingData?.circ_pescoco || '' },
    { label: 'Circunferência da Cintura (cm)', type: 'number', id: 'anth_cintura', step: '0.1', value: existingData?.circ_cintura || '' },
    { label: 'Circunferência do Quadril (cm)', type: 'number', id: 'anth_quadril', step: '0.1', value: existingData?.circ_quadril || '' },
    { label: '% Gordura Corporal', type: 'number', id: 'anth_gordura', step: '0.1', value: existingData?.gordura_corporal || '' },
    { label: 'Massa Magra (kg)', type: 'number', id: 'anth_massa_magra', step: '0.1', value: existingData?.massa_magra || '' },
    { label: '% Água Corporal', type: 'number', id: 'anth_agua', step: '0.1', value: existingData?.agua_corporal || '' },
    { label: 'Observações', type: 'textarea', id: 'anth_observacoes', value: existingData?.observacoes || '' }
  ];

  campos.forEach(campo => {
    const field = document.createElement('div');
    field.className = 'field';
    
    const label = document.createElement('label');
    label.textContent = campo.label;
    label.style.fontWeight = '500';
    
    let input;
    
    if (campo.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 3;
      input.value = campo.value;
      input.style.width = '100%';
      input.style.padding = '10px 12px';
      input.style.borderRadius = '6px';
      input.style.border = '1px solid #d1d5db';
      input.style.resize = 'vertical';
    } else {
      input = document.createElement('input');
      input.type = campo.type;
      input.value = campo.value;
      input.step = campo.step;
      input.style.width = '100%';
      input.style.padding = '10px 12px';
      input.style.borderRadius = '6px';
      input.style.border = '1px solid #d1d5db';
    }
    
    input.id = campo.id;
    field.appendChild(label);
    field.appendChild(input);
    form.appendChild(field);
  });

  // Calculadora de IMC
  const calcSection = document.createElement('div');
  calcSection.style.background = '#f0f9ff';
  calcSection.style.padding = '16px';
  calcSection.style.borderRadius = '8px';
  calcSection.style.border = '1px solid #bae6fd';
  
  calcSection.innerHTML = `
    <h4 style="margin: 0 0 12px 0; color: #0369a1;">🧮 Calculadora de IMC</h4>
    <div style="display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: end;">
      <div>
        <label style="font-size: 14px; color: #374151;">Peso (kg)</label>
        <input type="number" id="calc_peso" step="0.1" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #d1d5db;">
      </div>
      <div>
        <label style="font-size: 14px; color: #374151;">Altura (m)</label>
        <input type="number" id="calc_altura" step="0.01" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #d1d5db;">
      </div>
      <div>
        <button type="button" id="calcImcBtn" style="padding: 8px 16px; background: #0891b2; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Calcular IMC
        </button>
      </div>
      <div>
        <div style="font-size: 14px; color: #374151;">Resultado:</div>
        <div id="imcResult" style="font-weight: bold; color: #059669;"></div>
      </div>
    </div>
  `;
  
  form.appendChild(calcSection);

  modal.appendChild(form);

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'flex-end';
  actions.style.gap = '12px';
  actions.style.marginTop = '24px';
  actions.style.paddingTop = '16px';
  actions.style.borderTop = '1px solid #e5e7eb';
  
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn';
  cancel.style.background = '#94a3b8';
  cancel.textContent = 'Cancelar';
  cancel.onclick = () => backdrop.remove();
  
  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'btn btn-success';
  save.textContent = existingData ? 'Atualizar' : 'Salvar';

  save.onclick = async () => {
    try {
      await ensureAuth();
      
      const anthropometryData = {
        consultation_id: consultationId,
        peso: document.getElementById('anth_peso').value ? parseFloat(document.getElementById('anth_peso').value) : null,
        altura: document.getElementById('anth_altura').value ? parseFloat(document.getElementById('anth_altura').value) : null,
        circ_pescoco: document.getElementById('anth_pescoco').value ? parseFloat(document.getElementById('anth_pescoco').value) : null,
        circ_cintura: document.getElementById('anth_cintura').value ? parseFloat(document.getElementById('anth_cintura').value) : null,
        circ_quadril: document.getElementById('anth_quadril').value ? parseFloat(document.getElementById('anth_quadril').value) : null,
        gordura_corporal: document.getElementById('anth_gordura').value ? parseFloat(document.getElementById('anth_gordura').value) : null,
        massa_magra: document.getElementById('anth_massa_magra').value ? parseFloat(document.getElementById('anth_massa_magra').value) : null,
        agua_corporal: document.getElementById('anth_agua').value ? parseFloat(document.getElementById('anth_agua').value) : null,
        observacoes: document.getElementById('anth_observacoes').value.trim() || null
      };

      // Calcular IMC se peso e altura estiverem preenchidos
      if (anthropometryData.peso && anthropometryData.altura) {
        anthropometryData.imc = parseFloat((anthropometryData.peso / (anthropometryData.altura * anthropometryData.altura)).toFixed(1));
      }

      let result;
      if (existingData?.id) {
        result = await supabase
          .from('anthropometry')
          .update(anthropometryData)
          .eq('id', existingData.id)
          .select();
      } else {
        result = await supabase
          .from('anthropometry')
          .insert([anthropometryData])
          .select();
      }

      if (result.error) throw result.error;

      // Atualizar o estado local se necessário
      if (state.consultations && state.consultations[patientId]) {
        const consultationIndex = state.consultations[patientId].findIndex(c => c.id === consultationId);
        if (consultationIndex !== -1) {
          if (!state.consultations[patientId][consultationIndex].anthropometry) {
            state.consultations[patientId][consultationIndex].anthropometry = {};
          }
          state.consultations[patientId][consultationIndex].anthropometry = {
            ...state.consultations[patientId][consultationIndex].anthropometry,
            ...result.data[0]
          };
        }
      }

      backdrop.remove();
      alert('Dados antropométricos salvos com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar dados antropométricos:', error);
      alert('Erro ao salvar dados: ' + error.message);
    }
  };

  actions.appendChild(cancel);
  actions.appendChild(save);
  modal.appendChild(actions);

  backdrop.appendChild(modal);
  root.appendChild(backdrop);

  // Adicionar evento para calculadora de IMC
  document.getElementById('calcImcBtn').addEventListener('click', () => {
    const peso = parseFloat(document.getElementById('calc_peso').value);
    const altura = parseFloat(document.getElementById('calc_altura').value);
    
    if (peso && altura && altura > 0) {
      const imc = peso / (altura * altura);
      const resultado = imc.toFixed(1);
      
      let classificacao = '';
      if (imc < 18.5) classificacao = 'Abaixo do peso';
      else if (imc < 25) classificacao = 'Peso normal';
      else if (imc < 30) classificacao = 'Sobrepeso';
      else if (imc < 35) classificacao = 'Obesidade Grau I';
      else if (imc < 40) classificacao = 'Obesidade Grau II';
      else classificacao = 'Obesidade Grau III';
      
      document.getElementById('imcResult').textContent = `${resultado} - ${classificacao}`;
      
      // Preencher automaticamente os campos principais se estiverem vazios
      if (!document.getElementById('anth_peso').value) {
        document.getElementById('anth_peso').value = peso;
      }
      if (!document.getElementById('anth_altura').value) {
        document.getElementById('anth_altura').value = altura;
      }
    } else {
      alert('Preencha peso e altura para calcular o IMC.');
    }
  });
}

// Função para abrir antropometria a partir do perfil
window.openAnthropometryForm = openAnthropometryForm;
