// src/pdf.js - VERSÃO CORRIGIDA COM JSPDF GLOBAL E LAYOUT PROFISSIONAL
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
  const padding = 40;
  const contentWidth = pageWidth - padding*2;

  // Cores profissionais
  const primaryColor = '#1565C0';
  const secondaryColor = '#42A5F5';
  const accentColor = '#FF9800';
  const lightGray = '#f8f9fa';
  const darkGray = '#495057';
  const textColor = '#212529';

  // Configurações de fonte
  doc.setFont('helvetica');
  
  // Header com gradiente
  doc.setFillColor(21, 101, 192);
  doc.rect(0, 0, pageWidth, 120, 'F');
  
  // Logo/Ícone
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('🍎', padding, 50);
  
  // Título
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PLANO ALIMENTAR', padding + 40, 50);
  
  // Informações do paciente
  const patientName = state.currentPatient?.nome || '-';
  const dateStr = new Date().toLocaleDateString('pt-BR');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Paciente: ${patientName}`, padding + 40, 70);
  doc.text(`Data: ${dateStr}`, padding + 40, 85);
  
  // Linha divisória
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1);
  doc.line(padding, 100, pageWidth - padding, 100);

  let y = 140;
  const bottomLimit = pageHeight - 60;

  // Helper: ensure there's enough space for a block; if not, add page and reset y
  function ensureSpace(heightNeeded){
    if(y + heightNeeded > bottomLimit){
      doc.addPage();
      y = 80;
      // Header secundário em páginas adicionais
      doc.setFillColor(21, 101, 192);
      doc.rect(0, 0, pageWidth, 60, 'F');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(`Plano Alimentar - ${patientName}`, padding, 35);
      doc.text(`Página ${doc.internal.getNumberOfPages()}`, pageWidth - padding - 50, 35, {align: 'right'});
    }
  }

  // Resumo nutricional destacado
  const total = aggregateAll();
  const summaryHeight = 120;
  ensureSpace(summaryHeight);
  
  // Card de resumo
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(padding, y, contentWidth, summaryHeight, 5, 5, 'F');
  doc.setDrawColor(222, 226, 230);
  doc.roundedRect(padding, y, contentWidth, summaryHeight, 5, 5, 'S');
  
  doc.setFontSize(16);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO NUTRICIONAL', padding + 20, y + 25);
  
  // Grid de nutrientes
  const gridX = padding + 20;
  const gridY = y + 50;
  const colWidth = contentWidth / 4;
  
  const summaryItems = [
    { label: 'Calorias', value: `${formatNumber(total.calorias,0)} kcal`, color: primaryColor },
    { label: 'Proteínas', value: `${formatNumber(total.proteina)} g`, color: darkGray },
    { label: 'Carboidratos', value: `${formatNumber(total.carboidrato)} g`, color: darkGray },
    { label: 'Lipídios', value: `${formatNumber(total.lipidio)} g`, color: darkGray }
  ];
  
  summaryItems.forEach((item, index) => {
    const x = gridX + (index % 2) * (colWidth * 2);
    const yPos = gridY + Math.floor(index / 2) * 25;
    
    doc.setFontSize(10);
    doc.setTextColor(darkGray);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, x, yPos);
    
    doc.setFontSize(12);
    doc.setTextColor(item.color);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, x, yPos + 15);
  });
  
  // Nutrientes adicionais
  if(total.fibra > 0 || total.colesterol > 0) {
    const extraY = gridY + 50;
    doc.setFontSize(10);
    doc.setTextColor(darkGray);
    doc.setFont('helvetica', 'normal');
    
    let extraText = '';
    if(total.fibra > 0) extraText += `Fibras: ${formatNumber(total.fibra)} g`;
    if(total.colesterol > 0) extraText += `${extraText ? ' • ' : ''}Colesterol: ${formatNumber(total.colesterol)} mg`;
    if(total.sodio > 0) extraText += `${extraText ? ' • ' : ''}Sódio: ${formatNumber(total.sodio)} mg`;
    
    if(extraText) {
      doc.text(extraText, gridX, extraY);
    }
  }
  
  y += summaryHeight + 30;

  // Refeições
  MEALS.forEach(meal=>{
    const foods = state.meals[meal] || [];

    if (foods.length === 0) return;

    const estimatedHeight = 60 + (foods.length * 25) + 30;
    ensureSpace(estimatedHeight);

    // Título da refeição
    doc.setFillColor(66, 165, 245);
    doc.roundedRect(padding, y, contentWidth, 30, 3, 3, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(meal.toUpperCase(), padding + 15, y + 18);
    
    y += 40;

    // Cabeçalho da tabela
    doc.setFillColor(233, 236, 239);
    doc.rect(padding, y, contentWidth, 20, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(darkGray);
    doc.setFont('helvetica', 'bold');
    
    const colWidths = {
      name: contentWidth * 0.4,
      qty: contentWidth * 0.15,
      kcal: contentWidth * 0.15,
      nutrients: contentWidth * 0.3
    };

    let x = padding;
    doc.text('ALIMENTO', x + 10, y + 13);
    x += colWidths.name;
    doc.text('QTD (g)', x + 10, y + 13);
    x += colWidths.qty;
    doc.text('KCAL', x + 10, y + 13);
    x += colWidths.kcal;
    doc.text('INFORMAÇÕES NUTRICIONAIS', x + 10, y + 13);
    
    y += 25;

    // Itens da refeição
    foods.forEach((item, idx)=>{
      const food = state.taco[item.id] || { name: 'Desconhecido', calorias:0, proteina:0, carboidrato:0, lipidio:0 };
      const kcal = formatNumber(calcScaled(food.calorias||0, item.qty),0);
      
      // Background alternado
      if(idx % 2 === 0){
        doc.setFillColor(252, 252, 252);
      } else {
        doc.setFillColor(248, 249, 250);
      }
      doc.rect(padding, y, contentWidth, 20, 'F');

      x = padding;
      doc.setFontSize(8);
      doc.setTextColor(textColor);
      doc.setFont('helvetica', 'normal');
      
      // Nome do alimento (truncado se necessário)
      let foodName = food.name;
      if (foodName.length > 35) {
        foodName = foodName.substring(0, 32) + '...';
      }
      doc.text(foodName, x + 10, y + 12);
      
      // Quantidade
      x += colWidths.name;
      doc.text(String(item.qty), x + 10, y + 12);
      
      // Calorias
      x += colWidths.qty;
      doc.text(String(kcal), x + 10, y + 12);
      
      // Informações nutricionais
      x += colWidths.kcal;
      const nutrients = [];
      if (food.proteina) nutrients.push(`P: ${formatNumber(calcScaled(food.proteina, item.qty))}g`);
      if (food.carboidrato) nutrients.push(`C: ${formatNumber(calcScaled(food.carboidrato, item.qty))}g`);
      if (food.lipidio) nutrients.push(`L: ${formatNumber(calcScaled(food.lipidio, item.qty))}g`);
      if (food.fibra || food.fibra_alimentar) nutrients.push(`Fib: ${formatNumber(calcScaled(food.fibra || food.fibra_alimentar, item.qty))}g`);
      
      doc.text(nutrients.join(' • '), x + 10, y + 12);

      y += 20;
    });

    // Totais da refeição
    const mealTotal = foods.reduce((acc, item) => {
      const food = state.taco[item.id] || {};
      return {
        calorias: acc.calorias + calcScaled(food.calorias||0, item.qty),
        proteina: acc.proteina + calcScaled(food.proteina||0, item.qty),
        carboidrato: acc.carboidrato + calcScaled(food.carboidrato||0, item.qty),
        lipidio: acc.lipidio + calcScaled(food.lipidio||0, item.qty)
      };
    }, {calorias:0, proteina:0, carboidrato:0, lipidio:0});

    y += 10;
    doc.setFillColor(255, 243, 205);
    doc.rect(padding, y, contentWidth, 20, 'F');
    doc.setDrawColor(255, 193, 7);
    doc.rect(padding, y, contentWidth, 20, 'S');
    
    doc.setFontSize(9);
    doc.setTextColor(133, 100, 4);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL DA REFEIÇÃO: ${formatNumber(mealTotal.calorias,0)} kcal • Proteínas: ${formatNumber(mealTotal.proteina)}g • Carboidratos: ${formatNumber(mealTotal.carboidrato)}g • Lipídios: ${formatNumber(mealTotal.lipidio)}g`, 
             padding + 10, y + 12);
    
    y += 35;
  });

  // Resumo final profissional
  const finalBlockHeight = 150;
  ensureSpace(finalBlockHeight);
  
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(padding, y, contentWidth, finalBlockHeight, 5, 5, 'F');
  doc.setDrawColor(222, 226, 230);
  doc.roundedRect(padding, y, contentWidth, finalBlockHeight, 5, 5, 'S');
  
  doc.setFontSize(16);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO GERAL DA DIETA', padding + 20, y + 25);
  
  // Grid do resumo final
  const finalGridX = padding + 20;
  const finalGridY = y + 50;
  const finalColWidth = contentWidth / 2;
  
  const finalItems = [
    { label: 'Energia Total', value: `${formatNumber(total.calorias,0)} kcal`, emoji: '⚡' },
    { label: 'Proteínas', value: `${formatNumber(total.proteina)} g`, emoji: '🥩' },
    { label: 'Carboidratos', value: `${formatNumber(total.carboidrato)} g`, emoji: '🍚' },
    { label: 'Lipídios', value: `${formatNumber(total.lipidio)} g`, emoji: '🥑' },
    { label: 'Fibras Alimentares', value: `${formatNumber(total.fibra)} g`, emoji: '🥦' },
    { label: 'Valor Energético Total', value: `${formatNumber(total.calorias,0)} kcal`, emoji: '📊' }
  ];
  
  finalItems.forEach((item, index) => {
    const x = finalGridX + (index % 2) * finalColWidth;
    const yPos = finalGridY + Math.floor(index / 2) * 25;
    
    doc.setFontSize(9);
    doc.setTextColor(darkGray);
    doc.setFont('helvetica', 'normal');
    doc.text(item.emoji, x, yPos + 3);
    doc.text(item.label, x + 20, yPos);
    
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, x + 20, yPos + 12);
  });

  // Rodapé
  const footerY = pageHeight - 30;
  doc.setFontSize(8);
  doc.setTextColor(108, 117, 125);
  doc.setFont('helvetica', 'normal');
  doc.text('Plano alimentar elaborado pelo Sistema Nutricional - Para acompanhamento profissional', 
           pageWidth / 2, footerY, {align: 'center'});

  // save
  doc.save(`plano-alimentar-${state.currentPatient?.nome || 'paciente'}.pdf`);
}
