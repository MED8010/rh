/**
 * Script pour afficher toutes les colonnes avec les vraies données
 */

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'BASE DE DONNEES PL 6-4-2026.xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = 'demissionnaire 2025';
  const worksheet = workbook.Sheets[sheetName];
  
  // Obtenir toutes les données sans interprétation
  const allCells = worksheet;
  
  console.log('📋 Structure brute du fichier:\n');
  
  // Afficher les 5 premières lignes
  for (let row = 1; row <= 5; row++) {
    console.log(`\n─── LIGNE ${row} ───`);
    for (let col = 1; col <= 30; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
      const cell = allCells[cellRef];
      if (cell) {
        console.log(`Col ${col} (${cellRef}): ${cell.v}`);
      }
    }
  }
  
  // Ensuite afficher avec sheet_to_json
  console.log('\n\n======== DONNÉES JSON ========\n');
  const data = XLSX.utils.sheet_to_json(worksheet);
  console.log(`Clés trouvées: ${Object.keys(data[0]).join(' | ')}\n`);
  
  data.forEach((row, idx) => {
    if (idx < 3) {
      console.log(`\n--- ROW ${idx} ---`);
      console.log(JSON.stringify(row, null, 2));
    }
  });
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
}
