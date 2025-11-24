// src/pdf.js - VERSÃO CORRIGIDA COM JSPDF GLOBAL
import { state, MEALS, formatNumber, calcScaled } from './state.js';
import { aggregateAll } from './ui.js';

export function savePatientToPdfContext(){
  // Verificar se jspdf está disponível globalmente
  if (typeof window.jspdf === 'undefined') {
    alert('Erro: Biblioteca PDF não carregada. Tente recarregar a página.');
    return;
  }

  const { jsPDF } = window.jspdf;
  
  // create doc
  const doc = new jsPDF({unit:'pt',format:'a4'});
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const padding = 36;
  const contentWidth = pageWidth - padding*2;

  // styling helpers
  const blueTitle = '#1A73E8';
  const darkText = 30;
  const small = 10;
  const normal = 12;
  const titleSize = 16;

  doc.setFont('helvetica');

  // Header - centered: Patient name, Diet name, Date
  const patientName = state.currentPatient?.nome || '-';
  const dateStr = new Date().toLocaleString();

  doc.setFontSize(titleSize);
  doc.setTextColor(blueTitle);
  doc.text(patientName, pageWidth/2, 48, {align: 'center'});
  doc.setFontSize(normal);
  doc.setTextColor(darkText);
  doc.text(dateStr, pageWidth/2, 68, {align: 'center'});

  // horizontal divider
  const dividerY = 80;
  doc.setDrawColor(79,143,247);
  doc.setLineWidth(0.8);
  doc.line(padding, dividerY, pageWidth - padding, dividerY);

  // start content after header
  let y = dividerY + 16;
  const bottomLimit = pageHeight - 40;

  // Helper: ensure there's enough space for a block; if not, add page and reset y
  function ensureSpace(heightNeeded){
    if(y + heightNeeded > bottomLimit){
      doc.addPage();
      y = padding;
    }
  }

  // Patient data section
  const patientBlock = [];
  patientBlock.push(`Nome: ${patientName}`);
  if(state.currentPatient?.idade) patientBlock.push(`Idade: ${state.currentPatient.idade}`);
  if(state.currentPatient?.observacoes) patientBlock.push(`Observações: ${state.currentPatient.observacoes}`);

  const patientBlockHeight = patientBlock.length * 14 + 8;
  ensureSpace(patientBlockHeight);
  doc.setFontSize(normal);
  doc.setTextColor(10,30,80);
  doc.text('Dados do Paciente', padding, y);
  y += 16;
  doc.setFontSize(small);
  doc.setTextColor(darkText);
  patientBlock.forEach(line=>{
    doc.text(line, padding, y);
    y += 14;
  });
  y += 6;

  // Summary nutritional totals
  const total = aggregateAll();
  const summaryLines = [];
  summaryLines.push(`Calorias: ${formatNumber(total.calorias,0)} kcal`);
  summaryLines.push(`Proteínas: ${formatNumber(total.proteina)} g`);
  summaryLines.push(`Carboidratos: ${formatNumber(total.carboidrato)} g`);
  summaryLines.push(`Lipídios: ${formatNumber(total.lipidio)} g`);
  if(total.fibra !== undefined) summaryLines.push(`Fibras: ${formatNumber(total.fibra)} g`);

  const summaryBlockHeight = summaryLines.length * 14 + 22;
  ensureSpace(summaryBlockHeight);
  doc.setFontSize(normal);
  doc.setTextColor(10,30,80);
  doc.text('Resumo Nutricional Total', padding, y);
  y += 16;
  doc.setFontSize(small);
  doc.setTextColor(darkText);
  summaryLines.forEach(line=>{
    doc.text(line, padding, y);
    y += 14;
  });
  y += 8;

  // Meals: render each meal
  MEALS.forEach(meal=>{
    const foods = state.meals[meal] || [];

    if (foods.length === 0) return;

    const estimatedHeight = 16 + 18 + (foods.length * 20) + 18 + 14;

    if(y + estimatedHeight > bottomLimit){
      doc.addPage();
      y = padding;
    }

    // meal title
    doc.setFontSize(normal);
    doc.setTextColor(26,115,232);
    doc.text(meal, padding, y);
    y += 20;

    // draw table header
    doc.setFontSize(small);
    doc.setTextColor(10,30,80);
    
    const startX = padding;
    const colWidths = {
      name: contentWidth * 0.6,
      qty: 60,
      kcal: 70,
      prot: 50,
      carb: 50,
      lip: 50
    };

    // Header background
    doc.setFillColor(240,247,255);
    doc.rect(startX, y, contentWidth, 18, 'F');
    
    let x = startX;
    doc.text('Alimento', x + 6, y + 12);
    x += colWidths.name;
    doc.text('Qtd (g)', x + 6, y + 12);
    x += colWidths.qty;
    doc.text('Kcal', x + 6, y + 12);
    x += colWidths.kcal;
    doc.text('P', x + 6, y + 12);
    x += colWidths.prot;
    doc.text('C', x + 6, y + 12);
    x += colWidths.carb;
    doc.text('L', x + 6, y + 12);
    
    y += 22;

    // draw rows
    foods.forEach((item, idx)=>{
      const food = state.taco[item.id] || { name: 'Desconhecido', calorias:0, proteina:0, carboidrato:0, lipidio:0 };
      const kcal = formatNumber(calcScaled(food.calorias||0, item.qty),0);
      const p = formatNumber(calcScaled(food.proteina||0, item.qty));
      const c = formatNumber(calcScaled(food.carboidrato||0, item.qty));
      const l = formatNumber(calcScaled(food.lipidio||0, item.qty));

      // Row background alternating
      if(idx % 2 === 0){
        doc.setFillColor(250, 252, 255);
        doc.rect(startX, y, contentWidth, 16, 'F');
      }

      x = startX;
      doc.setTextColor(darkText);
      doc.setFontSize(10);
      
      // Truncate long names
      let foodName = food.name;
      if (foodName.length > 40) {
        foodName = foodName.substring(0, 37) + '...';
      }
      
      doc.text(foodName, x + 6, y + 10);
      x += colWidths.name;
      doc.text(String(item.qty), x + 6, y + 10);
      x += colWidths.qty;
      doc.text(String(kcal), x + 6, y + 10);
      x += colWidths.kcal;
      doc.text(String(p), x + 6, y + 10);
      x += colWidths.prot;
      doc.text(String(c), x + 6, y + 10);
      x += colWidths.carb;
      doc.text(String(l), x + 6, y + 10);

      y += 16;
    });

    y += 8;
  });

  // Final summary
  const finalBlockLines = [
    `Resumo Final`,
    `Calorias: ${formatNumber(total.calorias,0)} kcal`,
    `Proteínas: ${formatNumber(total.proteina)} g`,
    `Carboidratos: ${formatNumber(total.carboidrato)} g`,
    `Lipídios: ${formatNumber(total.lipidio)} g`,
  ];
  
  if(total.fibra !== undefined) finalBlockLines.push(`Fibras: ${formatNumber(total.fibra)} g`);

  const finalBlockHeight = finalBlockLines.length * 14 + 12;
  ensureSpace(finalBlockHeight);

  doc.setFontSize(normal);
  doc.setTextColor(10,30,80);
  doc.text('Resumo Geral da Dieta', padding, y);
  y += 16;
  doc.setFontSize(small);
  doc.setTextColor(darkText);
  finalBlockLines.forEach(line=>{
    doc.text(line, padding, y);
    y += 14;
  });

  // save
  doc.save(`dieta-${state.currentPatient?.nome || 'paciente'}.pdf`);
}
