// src/pdf.js - VERSÃO PROFISSIONAL COM DESIGN AZUL ELEGANTE
import { state, MEALS, formatNumber, calcScaled } from './state.js';
import { aggregateAll } from './ui.js';

export function savePatientToPdfContext(){
  if (typeof window.jspdf === 'undefined') {
    alert('Erro: Biblioteca PDF não carregada. Tente recarregar a página.');
    return;
  }

  const { jsPDF } = window.jspdf;
  
  // Criar documento
  const doc = new jsPDF({unit:'pt',format:'a4'});
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const padding = 40;
  const contentWidth = pageWidth - padding*2;

  // Paleta de cores azul profissional
  const primaryBlue = '#1e40af';
  const secondaryBlue = '#2563eb';
  const lightBlue = '#dbeafe';
  const accentBlue = '#3b82f6';
  const darkText = '#1e293b';
  const mediumText = '#475569';
  const lightText = '#64748b';

  // Configurações de fonte
  doc.setFont('helvetica');
  
  // Cabeçalho elegante
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 120, 'F');
  
  // Logo e título
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('🍎', padding, 55);
  doc.text('PLANO ALIMENTAR', padding + 35, 55);
  
  // Informações do paciente
  const patientName = state.currentPatient?.nome || 'Paciente';
  const dateStr = new Date().toLocaleDateString('pt-BR');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255, 0.9);
  doc.text(`Paciente: ${patientName}`, padding, 80);
  doc.text(`Data: ${dateStr}`, padding, 95);
  
  // Linha decorativa
  doc.setDrawColor(255, 255, 255, 0.3);
  doc.setLineWidth(1);
  doc.line(padding, 105, pageWidth - padding, 105);

  let y = 150;
  const bottomLimit = pageHeight - 60;

  function ensureSpace(heightNeeded){
    if(y + heightNeeded > bottomLimit){
      doc.addPage();
      y = 80;
      // Header secundário
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageWidth, 60, 'F');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255, 0.8);
      doc.text(`Plano Alimentar - ${patientName}`, padding, 35);
      doc.text(`Página ${doc.internal.getNumberOfPages()}`, pageWidth - padding - 40, 35, {align: 'right'});
    }
  }

  // Resumo nutricional elegante
  const total = aggregateAll();
  const summaryHeight = 100;
  ensureSpace(summaryHeight);
  
  // Card de resumo
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(padding, y, contentWidth, summaryHeight, 8, 8, 'F');
  doc.setDrawColor(96, 165, 250);
  doc.setLineWidth(0.5);
  doc.roundedRect(padding, y, contentWidth, summaryHeight, 8, 8, 'S');
  
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO NUTRICIONAL', padding + 20, y + 25);
  
  // Grid de nutrientes
  const gridX = padding + 20;
  const gridY = y + 50;
  const colWidth = contentWidth / 4;
  
  const summaryItems = [
    { label: 'Calorias', value: `${formatNumber(total.calorias,0)} kcal`, emoji: '⚡' },
    { label: 'Proteínas', value: `${formatNumber(total.proteina)} g`, emoji: '🥩' },
    { label: 'Carboidratos', value: `${formatNumber(total.carboidrato)} g`, emoji: '🍚' },
    { label: 'Lipídios', value: `${formatNumber(total.lipidio)} g`, emoji: '🥑' }
  ];
  
  summaryItems.forEach((item, index) => {
    const x = gridX + (index % 2) * (colWidth * 2);
    const yPos = gridY + Math.floor(index / 2) * 25;
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(item.emoji, x, yPos + 3);
    doc.text(item.label, x + 15, yPos);
    
    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, x + 15, yPos + 14);
  });
  
  y += summaryHeight + 30;

  // Refeições
  MEALS.forEach(meal=>{
    const foods = state.meals[meal] || [];

    if (foods.length === 0) return;

    const estimatedHeight = 50 + (foods.length * 22) + 30;
    ensureSpace(estimatedHeight);

    // Título da refeição com gradiente
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(padding, y, contentWidth, 30, 4, 4, 'F');
    
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(meal.toUpperCase(), padding + 15, y + 18);
    
    y += 40;

    // Cabeçalho da tabela
    doc.setFillColor(241, 245, 249);
    doc.rect(padding, y, contentWidth, 20, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    
    const colWidths = {
      name: contentWidth * 0.45,
      qty: contentWidth * 0.15,
      kcal: contentWidth * 0.15,
      nutrients: contentWidth * 0.25
    };

    let x = padding;
    doc.text('ALIMENTO', x + 10, y + 13);
    x += colWidths.name;
    doc.text('QTD', x + 10, y + 13);
    x += colWidths.qty;
    doc.text('KCAL', x + 10, y + 13);
    x += colWidths.kcal;
    doc.text('NUTRIENTES', x + 10, y + 13);
    
    y += 25;

    // Itens da refeição
    foods.forEach((item, idx)=>{
      const food = state.taco[item.id] || { name: 'Alimento não encontrado', calorias:0, proteina:0, carboidrato:0, lipidio:0 };
      const kcal = formatNumber(calcScaled(food.calorias||0, item.qty),0);
      
      // Background alternado suave
      if(idx % 2 === 0){
        doc.setFillColor(248, 250, 252);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(padding, y, contentWidth, 18, 'F');

      x = padding;
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      
      // Nome do alimento
      let foodName = food.name;
      if (foodName.length > 40) {
        foodName = foodName.substring(0, 37) + '...';
      }
      doc.text(foodName, x + 10, y + 11);
      
      // Quantidade
      x += colWidths.name;
      doc.text(String(item.qty), x + 10, y + 11);
      
      // Calorias
      x += colWidths.qty;
      doc.text(String(kcal), x + 10, y + 11);
      
      // Informações nutricionais compactas
      x += colWidths.kcal;
      const nutrients = [];
      if (food.proteina) nutrients.push(`P:${formatNumber(calcScaled(food.proteina, item.qty))}`);
      if (food.carboidrato) nutrients.push(`C:${formatNumber(calcScaled(food.carboidrato, item.qty))}`);
      if (food.lipidio) nutrients.push(`L:${formatNumber(calcScaled(food.lipidio, item.qty))}`);
      
      doc.text(nutrients.join(' '), x + 10, y + 11);

      y += 18;
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

    y += 8;
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(padding, y, contentWidth, 20, 4, 4, 'F');
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.roundedRect(padding, y, contentWidth, 20, 4, 4, 'S');
    
    doc.setFontSize(9);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: ${formatNumber(mealTotal.calorias,0)} kcal • P:${formatNumber(mealTotal.proteina)}g • C:${formatNumber(mealTotal.carboidrato)}g • L:${formatNumber(mealTotal.lipidio)}g`, 
             padding + 10, y + 12);
    
    y += 35;
  });

  // Resumo final profissional
  const finalBlockHeight = 120;
  ensureSpace(finalBlockHeight);
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(padding, y, contentWidth, finalBlockHeight, 8, 8, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(padding, y, contentWidth, finalBlockHeight, 8, 8, 'S');
  
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMAÇÕES GERAIS', padding + 20, y + 25);
  
  // Detalhes do resumo
  const finalGridX = padding + 20;
  const finalGridY = y + 50;
  
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  
  const details = [
    `• Valor Energético Total: ${formatNumber(total.calorias,0)} kcal`,
    `• Distribuição de Macronutrientes`,
    `• Proteínas: ${formatNumber(total.proteina)}g (${formatNumber((total.proteina * 4 / total.calorias) * 100, 1)}% do VET)`,
    `• Carboidratos: ${formatNumber(total.carboidrato)}g (${formatNumber((total.carboidrato * 4 / total.calorias) * 100, 1)}% do VET)`,
    `• Lipídios: ${formatNumber(total.lipidio)}g (${formatNumber((total.lipidio * 9 / total.calorias) * 100, 1)}% do VET)`,
    total.fibra > 0 ? `• Fibras: ${formatNumber(total.fibra)}g` : ''
  ].filter(Boolean);
  
  details.forEach((detail, index) => {
    doc.text(detail, finalGridX, finalGridY + (index * 12));
  });

  // Rodapé profissional
  const footerY = pageHeight - 30;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('Plano alimentar personalizado • Sistema Nutricional Profissional • Para acompanhamento médico', 
           pageWidth / 2, footerY, {align: 'center'});

  // save
  const fileName = `plano-alimentar-${patientName.toLowerCase().replace(/\s+/g, '-')}-${dateStr.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
  
  console.log('✅ PDF gerado com sucesso:', fileName);
}
