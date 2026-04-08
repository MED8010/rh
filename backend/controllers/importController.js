/**
 * Controller pour l'import de pointages via Excel
 */

const XLSX = require('xlsx');
const Pointage = require('../models/Pointage');
const Employe = require('../models/Employe');

// Pour convertir les dates Excel en Date JS
const excelDateToJSDate = (excelDate) => {
  if (!excelDate || typeof excelDate !== 'number') return null;
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return isNaN(date.getTime()) ? null : date;
};

const cleanValue = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'string') return val.trim() || null;
  if (typeof val === 'number') return val;
  return val;
};

exports.importPointagesExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploade' });
    }

    // Lire le fichier Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });

    if (data.length === 0) {
      return res.status(400).json({ error: 'Le fichier Excel est vide' });
    }

    console.log(`📖 Importation de ${data.length} pointages`);

    let importedCount = 0;
    let errors = [];
    const importedPointages = [];

    // Traiter chaque ligne
    for (let idx = 0; idx < data.length; idx++) {
      const row = data[idx];

      // Vérifier qu'on a les données minimales
      if (!row || (!row['Matricule'] && !row['matricule'] && !row['Employe'] && !row['employe'])) {
        continue;
      }

      try {
        // Extraire les colonnes (gérer différents noms possibles)
        const matricule = cleanValue(row['Matricule'] || row['matricule'] || row['MAT']);
        const dateStr = cleanValue(row['Date'] || row['date'] || row['DATE']);
        const heureEntree = cleanValue(row['Heure Entrée'] || row['heure_entree'] || row['H_ENTREE']);
        const heureSortie = cleanValue(row['Heure Sortie'] || row['heure_sortie'] || row['H_SORTIE']);
        const absence = cleanValue(row['Absence'] || row['absence'] || row['ABSENCE']);
        const motifAbsence = cleanValue(row['Motif Absence'] || row['motif_absence'] || row['MOTIF']);
        const retardMinutes = cleanValue(row['Retard (min)'] || row['retard_minutes'] || row['RETARD_MIN']);
        const source = cleanValue(row['Source'] || row['source'] || 'manual');

        // Chercher l'employé
        let employe = null;
        if (matricule) {
          employe = await Employe.findOne({ matricule });
        }

        if (!employe) {
          errors.push({
            row: idx + 1,
            error: `Employé avec matricule "${matricule}" non trouvé`
          });
          continue;
        }

        // Convertir la date
        let date;
        if (typeof dateStr === 'number') {
          date = excelDateToJSDate(dateStr);
        } else if (typeof dateStr === 'string') {
          date = new Date(dateStr);
        }

        if (!date || isNaN(date.getTime())) {
          errors.push({
            row: idx + 1,
            error: `Date invalide: "${dateStr}"`
          });
          continue;
        }

        // Convertir les heures (format HH:MM)
        let hE = null;
        let hS = null;

        if (heureEntree) {
          if (typeof heureEntree === 'number') {
            // Convertir depuis format Excel (fraction de jour)
            const hours = Math.floor(heureEntree * 24);
            const minutes = Math.floor((heureEntree * 24 - hours) * 60);
            hE = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          } else {
            hE = String(heureEntree).trim();
          }
        }

        if (heureSortie) {
          if (typeof heureSortie === 'number') {
            const hours = Math.floor(heureSortie * 24);
            const minutes = Math.floor((heureSortie * 24 - hours) * 60);
            hS = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          } else {
            hS = String(heureSortie).trim();
          }
        }

        // Vérifier que ce pointage n'existe pas déjà
        const existing = await Pointage.findOne({
          employe: employe._id,
          date: {
            $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
          }
        });

        if (existing) {
          errors.push({
            row: idx + 1,
            error: `Pointage pour ${employe.nom} le ${date.toLocaleDateString()} existe déjà`
          });
          continue;
        }

        // Créer le pointage
        const pointage = await Pointage.create({
          employe: employe._id,
          date,
          heure_entree: hE,
          heure_sortie: hS,
          absence: absence === true || String(absence).toLowerCase() === 'true' || String(absence).toLowerCase() === 'oui',
          motif_absence: motifAbsence,
          retard_minutes: retardMinutes ? parseInt(retardMinutes) : 0,
          source: source && (source.toLowerCase() === 'biometric' || source.toLowerCase() === 'biométrique') ? 'biometric' : 'manual'
        });

        importedPointages.push(pointage);
        importedCount++;

      } catch (error) {
        errors.push({
          row: idx + 1,
          error: error.message
        });
      }
    }

    // Supprimer le fichier temporaire
    require('fs').unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `${importedCount} pointages importés avec succès`,
      imported: importedCount,
      errors: errors.length > 0 ? errors.slice(0, 5) : [],
      errorCount: errors.length
    });

  } catch (error) {
    if (req.file) {
      require('fs').unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      error: error.message,
      details: error.stack 
    });
  }
};

exports.exportPointageTemplate = (req, res) => {
  try {
    // Créer un template Excel pour les pointages
    const template = [
      {
        'Matricule': 'Ex: 638',
        'Date': new Date(),
        'Heure Entrée': '08:00',
        'Heure Sortie': '17:00',
        'Absence': 'NON',
        'Motif Absence': '',
        'Retard (min)': 0,
        'Source': 'manual'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pointages');

    // Ajouter une feuille de notes
    const notes = [
      { Instructions: 'Comment remplir le fichier' },
      { Colonne: 'Description' },
      { Matricule: 'Code employé (obligatoire)' },
      { Date: 'Date du pointage (format: DD/MM/YYYY)' },
      { 'Heure Entrée': 'Format HH:MM (ex: 08:30)' },
      { 'Heure Sortie': 'Format HH:MM (ex: 17:00)' },
      { Absence: 'OUI ou NON' },
      { 'Motif Absence': "Raison de l'absence si applicable" },
      { 'Retard (min)': 'Nombre de minutes de retard' },
      { Source: 'manual ou biometric' }
    ];

    const notesSheet = XLSX.utils.json_to_sheet(notes);
    XLSX.utils.book_append_sheet(wb, notesSheet, 'Instructions');

    // Générer le fichier en buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Envoyer le fichier
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Pointage_Template.xlsx');
    res.send(buffer);

  } catch (error) {
    console.error('Erreur export template:', error);
    res.status(500).json({ error: error.message });
  }
};
