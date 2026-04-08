/**
 * Analyse la structure du fichier Pointage vierge.xlsx
 */

const XLSX = require('xlsx');
const path = require('path');

try {
  // Chercher le fichier
  const files = require('fs').readdirSync(process.cwd());
  const pointageFile = files.find(f => f.includes('Pointage') && f.endsWith('.xlsx'));
  
  if (!pointageFile) {
    console.log('❌ Fichier Pointage*.xlsx non trouvé');
    console.log('📁 Fichiers .xlsx disponibles:', files.filter(f => f.endsWith('.xlsx')));
    process.exit(1);
  }

  console.log(`📖 Lecture du fichier: ${pointageFile}\n`);
  
  const workbook = XLSX.readFile(pointageFile);
  
  console.log('📋 Feuilles disponibles:');
  workbook.SheetNames.forEach((name, idx) => {
    console.log(`   ${idx + 1}. ${name}`);
  });
  
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
    console.log(`  Colonnes: ${Object.keys(data[0]).join(' | ')}`);
    
    console.log(`\n  📍 Premiers enregistrements:`);
    data.slice(0, 3).forEach((row, idx) => {
      console.log(`\n    Ligne ${idx + 1}:`);
      Object.keys(row).forEach(key => {
        console.log(`      ${key}: ${row[key]}`);
      });
    });
  });
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
