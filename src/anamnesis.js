// src/anamnesis.js - SISTEMA COMPLETO DE ANAMNESE
import supabase, { ensureAuth } from './supabase.js';
import { state } from './state.js';

export async function openAnamnesisForm(consultationId, patientId, existingData = null) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = '';
  
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '900px';
  modal.style.width = '95%';
  modal.style.maxHeight = '90vh';
  modal.style.overflowY = 'auto';

  const title = document.createElement('h3');
  title.textContent = '📝 Anamnese Nutricional';
  title.style.color = '#1565C0';
  title.style.marginBottom = '24px';
  modal.appendChild(title);

  const form = document.createElement('form');
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = '20px';

  // Seções da anamnese
  const secoes = [
    {
      titulo: 'Histórico Clínico',
      campos: [
        { label: 'Histórico de Doenças', type: 'textarea', id: 'ana_historico_clinico', value: existingData?.historico_clinico || '' },
        { label: 'Histórico Familiar', type: 'textarea', id: 'ana_historico_familiar', value: existingData?.historico_familiar || '' },
        { label: 'Cirurgias Prévia', type: 'textarea', id: 'ana_cirurgias', value: existingData?.cirurgias || '' }
      ]
    },
    {
      titulo: 'Hábitos Alimentares',
      campos: [
        { label: 'Rotina Alimentar', type: 'textarea', id: 'ana_rotina', value: existingData?.rotina || '' },
        { label: 'Alergias Alimentares', type: 'textarea', id: 'ana_alergias', value: existingData?.alergias || '' },
        { label: 'Restrições Alimentares', type: 'textarea', id: 'ana_restricoes', value: existingData?.restricoes || '' },
        { label: 'Suplementos Utilizados', type: 'textarea', id: 'ana_suplementos', value: existingData?.suplementos || '' }
      ]
    },
    {
      titulo: 'Estilo de Vida',
      campos: [
        { label: 'Consumo Hídrico Diário', type: 'textarea', id: 'ana_consumo_hidrico', value: existingData?.consumo_hidrico || '' },
        { label: 'Qualidade do Sono', type: 'textarea', id: 'ana_sono', value: existingData?.sono || '' },
        { label: 'Nível de Atividade Física', type: 'textarea', id: 'ana_atividade_fisica', value: existingData?.atividade_fisica || '' },
        { label: 'Tabagismo', type: 'textarea', id: 'ana_tabagismo', value: existingData?.tabagismo || '' },
        { label: 'Etilismo', type: 'textarea', id: 'ana_etilismo', value: existingData?.etilismo || '' }
      ]
    },
    {
      titulo: 'Medicações e Tratamentos',
      campos: [
        { label: 'Medicações em Uso', type: 'textarea', id: 'ana_medicacoes', value: existingData?.medicacoes || '' },
        { label: 'Tratamentos em Andamento', type: 'textarea', id: 'ana_tratamentos', value: existingData?.tratamentos || '' }
      ]
    },
    {
      titulo: 'Outras Informações',
      campos: [
        { label: 'Observações Gerais', type: 'textarea', id: 'ana_observacoes', value: existingData?.observacoes || '' }
      ]
    }
  ];

  secoes.forEach(secao => {
    const secaoDiv = document.createElement('div');
    secaoDiv.style.background = '#f8fafc';
    secaoDiv.style.padding = '20px';
    secaoDiv.style.borderRadius = '8px';
    secaoDiv.style.border = '1px solid #e2e8f0';
    
    const titulo = document.createElement('h4');
    titulo.textContent = secao.titulo;
    titulo.style.color = '#374151';
    titulo.style.margin = '0 0 16px 0';
    titulo.style.fontSize = '16px';
    secaoDiv.appendChild(titulo);
    
    secao.campos.forEach(campo => {
      const field = document.createElement('div');
      field.className = 'field';
      field.style.marginBottom = '16px';
      
      const label = document.createElement('label');
      label.textContent = campo.label;
      label.style.fontWeight = '500';
      label.style.display = 'block';
      label.style.marginBottom = '6px';
      label.style.color = '#374151';
      
      const input = document.createElement('textarea');
      input.rows = 3;
      input.value = campo.value;
      input.id = campo.id;
      input.style.width = '100%';
      input.style.padding = '10px 12px';
      input.style.borderRadius = '6px';
      input.style.border = '1px solid #d1d5db';
      input.style.resize = 'vertical';
      input.style.fontFamily = 'inherit';
      
      field.appendChild(label);
      field.appendChild(input);
      secaoDiv.appendChild(field);
    });
    
    form.appendChild(secaoDiv);
  });

  modal.appendChild(form);

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'flex-end';
  actions.style.gap = '12px';
  actions.style.marginTop = '24px';
  actions.style.paddingTop = '16px';
  actions.style.borderTop = '1px solid #e5e7eb';
  actions.style.position = 'sticky';
  actions.style.bottom = '0';
  actions.style.background = 'white';
  
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
      
      const anamnesisData = {
        consultation_id: consultationId,
        historico_clinico: document.getElementById('ana_historico_clinico').value.trim() || null,
        historico_familiar: document.getElementById('ana_historico_familiar').value.trim() || null,
        alergias: document.getElementById('ana_alergias').value.trim() || null,
        restricoes: document.getElementById('ana_restricoes').value.trim() || null,
        rotina: document.getElementById('ana_rotina').value.trim() || null,
        consumo_hidrico: document.getElementById('ana_consumo_hidrico').value.trim() || null,
        sono: document.getElementById('ana_sono').value.trim() || null,
        medicacoes: document.getElementById('ana_medicacoes').value.trim() || null,
        observacoes: document.getElementById('ana_observacoes').value.trim() || null
      };

      let result;
      if (existingData?.id) {
        result = await supabase
          .from('anamneses')
          .update(anamnesisData)
          .eq('id', existingData.id)
          .select();
      } else {
        result = await supabase
          .from('anamneses')
          .insert([anamnesisData])
          .select();
      }

      if (result.error) throw result.error;

      // Atualizar o estado local se necessário
      if (state.consultations && state.consultations[patientId]) {
        const consultationIndex = state.consultations[patientId].findIndex(c => c.id === consultationId);
        if (consultationIndex !== -1) {
          if (!state.consultations[patientId][consultationIndex].anamneses) {
            state.consultations[patientId][consultationIndex].anamneses = {};
          }
          state.consultations[patientId][consultationIndex].anamneses = {
            ...state.consultations[patientId][consultationIndex].anamneses,
            ...result.data[0]
          };
        }
      }

      backdrop.remove();
      alert('Anamnese salva com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar anamnese:', error);
      alert('Erro ao salvar anamnese: ' + error.message);
    }
  };

  actions.appendChild(cancel);
  actions.appendChild(save);
  modal.appendChild(actions);

  backdrop.appendChild(modal);
  root.appendChild(backdrop);
}

// Função para abrir anamnese a partir do perfil
window.openAnamnesisForm = openAnamnesisForm;
