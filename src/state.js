// src/state.js - VERSÃO COMPLETA ATUALIZADA
import { supabase } from './supabase.js';

export const MEALS = [
  "Café da manhã", "Lanche da manhã", "Almoço", "Lanche da tarde", "Jantar", "Ceia"
];

export const state = {
  taco: {},
  meals: {},
  patient: {
    id: null,
    nome: 'Paciente Exemplo',
    data_nascimento: '',
    genero: '',
    cpf: '',
    telefone: '',
    email: '',
    tags: [],
    observacoes: ''
  },
  patients: {},
  editingDiet: null,
  unsavedChanges: false,
  currentDietDbId: null,
  consultations: {}, // patientId -> array de consultas
  currentConsultation: null
};

MEALS.forEach(m => state.meals[m] = []);

// Carregar pacientes do Supabase
export async function loadPatientsFromDB() {
  try {
    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    
    state.patients = {};
    patients.forEach(p => {
      state.patients[p.id] = {
        id: p.id,
        nome: p.nome,
        data_nascimento: p.data_nascimento,
        genero: p.genero,
        cpf: p.cpf,
        telefone: p.telefone,
        email: p.email,
        tags: p.tags || [],
        observacoes: p.observacoes,
        dietas: [],
        consultas: []
      };
    });
    
    console.log(`✅ ${patients.length} pacientes carregados do Supabase`);
    
  } catch (error) {
    console.error('❌ Erro ao carregar pacientes:', error);
    loadMockPatients();
  }
}

// Carregar dietas de um paciente
export async function loadPatientDiets(patientId) {
  try {
    const { data: diets, error } = await supabase
      .from('diets')
      .select(`
        *,
        meals (
          id,
          nome,
          meal_items (
            id,
            quantidade_gramas,
            foods (*)
          )
        )
      `)
      .eq('patient_id', patientId)
      .order('data', { ascending: false });
    
    if (error) throw error;
    
    const patient = state.patients[patientId];
    if (patient) {
      patient.dietas = diets.map(diet => ({
        id: diet.id,
        name: `Dieta ${new Date(diet.data).toLocaleDateString()}`,
        objetivo: diet.objetivo,
        createdAt: diet.data,
        meals: convertDbMealsToAppFormat(diet.meals)
      }));
    }
    
    console.log(`✅ ${diets.length} dietas carregadas para paciente ${patientId}`);
    
  } catch (error) {
    console.error('❌ Erro ao carregar dietas:', error);
    loadMockDiets(patientId);
  }
}

// Carregar consultas de um paciente
export async function loadPatientConsultations(patientId) {
  try {
    const { data: consultations, error } = await supabase
      .from('consultations')
      .select(`
        *,
        anamneses (*),
        anthropometry (*),
        plans (*),
        guidelines (*),
        manipulados (*)
      `)
      .eq('patient_id', patientId)
      .order('data_horario', { ascending: false });
    
    if (error) throw error;
    
    if (!state.consultations) state.consultations = {};
    state.consultations[patientId] = consultations;
    
    const patient = state.patients[patientId];
    if (patient) {
      patient.consultas = consultations;
    }
    
    console.log(`✅ ${consultations.length} consultas carregadas para paciente ${patientId}`);
    
  } catch (error) {
    console.error('❌ Erro ao carregar consultas:', error);
  }
}

// Converter estrutura do banco para formato da app
function convertDbMealsToAppFormat(dbMeals) {
  const appMeals = {};
  MEALS.forEach(m => appMeals[m] = []);
  
  dbMeals?.forEach(meal => {
    const mealName = meal.nome;
    if (MEALS.includes(mealName)) {
      appMeals[mealName] = meal.meal_items.map(item => ({
        id: item.foods.id,
        qty: item.quantidade_gramas,
        foodData: item.foods
      }));
    }
  });
  
  return appMeals;
}

// Converter formato da app para estrutura do banco
export function convertAppMealsToDbFormat(appMeals) {
  const dbMeals = [];
  
  Object.keys(appMeals).forEach(mealName => {
    if (appMeals[mealName].length > 0) {
      dbMeals.push({
        nome: mealName,
        meal_items: appMeals[mealName].map(item => ({
          food_id: item.id,
          quantidade_gramas: item.qty
        }))
      });
    }
  });
  
  return dbMeals;
}

// Fallback para dados mock
function loadMockPatients() {
  console.log('🔧 Carregando pacientes mock...');
  state.patients = {
    '1': {
      id: '1',
      nome: 'João Silva',
      data_nascimento: '1988-05-15',
      genero: 'Masculino',
      telefone: '(11) 99999-9999',
      email: 'joao@email.com',
      tags: ['diabetes', 'hipertensão'],
      observacoes: 'Paciente exemplo',
      dietas: [],
      consultas: []
    }
  };
}

function loadMockDiets(patientId) {
  const patient = state.patients[patientId];
  if (patient) {
    patient.dietas = [
      {
        id: 'diet-1',
        name: 'Dieta Exemplo',
        objetivo: 'Manutenção do peso',
        createdAt: new Date().toLocaleDateString(),
        meals: {}
      }
    ];
    MEALS.forEach(m => patient.dietas[0].meals[m] = []);
  }
}

export function formatNumber(n, digits = 1) {
  return Number.isFinite(n) ? Number(n.toFixed(digits)) : 0;
}

export function calcScaled(nPer100, qty) {
  return (nPer100 * qty) / 100;
}

// Calcular idade a partir da data de nascimento
export function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null;
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

// Inicializar carregando pacientes
loadPatientsFromDB();
