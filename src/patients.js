// src/patients.js - FACADE SIMPLIFICADO
// Este arquivo agora serve apenas como facade para evitar importações circulares

export { 
  initPatientUI, 
  openPatientManager, 
  selectPatient, 
  renderPatientList, 
  openEditPatientForm,
  deletePatient 
} from './patientManager.js';

export { 
  openPatientDiets, 
  createNewDietForPatient, 
  saveCurrentSessionAsDiet, 
  loadDietToSession, 
  saveEditingDiet, 
  saveCurrentDiet 
} from './patientDiets.js';

export { openPatientConsultations } from './consultations.js';
