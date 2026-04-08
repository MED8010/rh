/**
 * Script pour analyser la structure du fichier Excel
 */

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'BASE DE DONNEES PL 6-4-2026.xlsx');

try {
  console.log('📖 Lecture du fichier Excel...\n');
  
  const workbook = XLSX.readFile(filePath);
  
  console.log('📋 Feuilles disponibles:');
  workbook.SheetNames.forEach((name, index) => {
    console.log(`   ${index + 1}. ${name}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  // Analyser chaque feuille
  workbook.SheetNames.forEach((sheetName) => {
    console.log(`\n📄 Feuille: "${sheetName}"`);
    console.log('─'.repeat(60));
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) {
      console.log('  (Vide)');
      return;
    }
    
    console.log(`  Nombre de lignes: ${data.length}`);
    console.log(`  Colonnes: ${Object.keys(data[0]).join(', ')}`);
    
    console.log(`\n  📍 Premiers enregistrements:`);
    data.slice(0, 3).forEach((row, idx) => {
      console.log(`    \n    Ligne ${idx + 1}:`);
      Object.keys(row).forEach(key => {
        console.log(`      ${key}: ${row[key]}`);
      });
    });
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Analyse terminée\n');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
