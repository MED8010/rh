/**
 * Script d'importation des données Excel vers MongoDB
 */

const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config();

// Import models
const Employe = require('./backend/models/Employe');
const Service = require('./backend/models/Service');
const UAP = require('./backend/models/UAP');
const User = require('./backend/models/User');

const filePath = path.join(__dirname, 'BASE DE DONNEES PL 6-4-2026.xlsx');

// Fonction pour convertir les dates Excel en Date JS
function excelDateToJSDate(excelDate) {
  if (!excelDate || typeof excelDate !== 'number') return null;
  // Excel compte à partir du 1/1/1900
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return isNaN(date.getTime()) ? null : date;
}

// Fonction pour nettoyer les valeurs
function cleanValue(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'string') return val.trim() || null;
  if (typeof val === 'number') return val;
  return val;
}

const importData = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté\n');

    // Lire le fichier Excel
    console.log('📖 Lecture du fichier Excel...');
    const workbook = XLSX.readFile(filePath);
    const sheetName = 'demissionnaire 2025';
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`✅ ${data.length} lignes lues (header + data)\n`);

    // Récupérer ou créer les services/UAPs
    console.log('Préparation des services et UAPs...');
    let services = await Service.find({});
    let uaps = await UAP.find({});

    if (services.length === 0) {
      console.log('Création des services par défaut...');
      services = await Service.insertMany([
        { nom: 'Production' },
        { nom: 'Maintenance' },
        { nom: 'Qualité' },
        { nom: 'Administration' },
        { nom: 'Ressources Humaines' }
      ]);
    }

    if (uaps.length === 0) {
      console.log('Création des UAPs par défaut...');
      uaps = await UAP.insertMany([
        { nom: 'UAP 1', service: services[0]._id },
        { nom: 'UAP 2', service: services[0]._id },
        { nom: 'UAP 3', service: services[1]._id }
      ]);
    }

    console.log(`✅ ${services.length} services, ${uaps.length} UAPs prêts\n`);

    // Traiter les employés (commencer à l'index 2, car 0=chiffres, 1=headers)
    console.log('🔄 Importation des employés...\n');
    let createdCount = 0;
    let errors = [];

    for (let idx = 0; idx < data.length; idx++) {
      const row = data[idx];
      
      // Sauter les lignes de titres et vides
      if (row['__EMPTY'] === 'N°' || row['__EMPTY'] === 'tx horaire' || !row['__EMPTY_1']) {
        continue;
      }
      
      try {
        // Extraire les données avec le bon mapping
        const matricule = String(cleanValue(row['__EMPTY_1']) || `EMP${Date.now()}`);
        const prenom = cleanValue(row['__EMPTY_2']) || 'Prénom';
        const nom = cleanValue(row['4/6/26']) || 'Nom';
        const sexe = cleanValue(row['__EMPTY_22']) === 'F' ? 'F' : 'H';
        const email = cleanValue(row['__EMPTY_4']) || `${matricule.toLowerCase()}@company.com`;
        
        // Dates - convertir les dates Excel
        const dateNaissance = excelDateToJSDate(row['__EMPTY_18']);
        const dateEmbauche = excelDateToJSDate(row['__EMPTY_25']) || 
                             excelDateToJSDate(row['__EMPTY_15']) ||
                             new Date();
        
        // Salaire
        const prixHeure = parseFloat(cleanValue(row['__EMPTY_46'])) || 4.0;
        const salaireBase = parseFloat(cleanValue(row['__EMPTY_47'])) || (prixHeure * 160);
        
        // Service
        const serviceName = cleanValue(row['__EMPTY_7']) || 'Production';
        let service = services.find(s => 
          s.nom.toLowerCase().includes(serviceName.toLowerCase()) ||
          serviceName.toLowerCase().includes(s.nom.toLowerCase())
        ) || services[0];
        
        // Vérifier qu'un employé avec ce matricule n'existe pas
        const existing = await Employe.findOne({ matricule });
        if (existing) {
          errors.push({
            row: idx,
            error: `Matricule ${matricule} déjà existe`
          });
          continue;
        }

        // Créer User si nécessaire
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            email,
            password: 'Temp123456', // Mot de passe temporaire
            role: 'employe'
          });
        }

        // Créer Employe
        const employe = await Employe.create({
          matricule,
          prenom,
          nom,
          sexe,
          email,
          dateNaissance,
          date_embauche: dateEmbauche,
          prix_heure: prixHeure,
          service: service._id,
          uap: uaps[0]._id,
          user: user._id,
          rib: cleanValue(row['__EMPTY_59']),
          cin: cleanValue(row['__EMPTY_9']),
          adresse: cleanValue(row['__EMPTY_33']),
          ville: cleanValue(row['__EMPTY_34']),
          telephone: cleanValue(row['__EMPTY_36'])
        });

        console.log(`✅ ${createdCount + 1}. ${nom} (${matricule}) - ${prixHeure} DT/h`);
        createdCount++;

      } catch (error) {
        errors.push({
          row: idx,
          error: error.message,
          data: row['__EMPTY_1']
        });
        console.log(`  ❌ Ligne ${idx}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ IMPORTATION TERMINÉE!');
    console.log('='.repeat(60));
    console.log(`\n📊 Résultats:`);
    console.log(`  • Employés importés: ${createdCount}`);
    console.log(`  • Erreurs: ${errors.length}`);
    
    if (errors.length > 0 && errors.length <= 5) {
      console.log(`\n⚠️  Erreurs rencontrées:`);
      errors.forEach(e => {
        console.log(`  Ligne ${e.row} (MAT: ${e.data}): ${e.error}`);
      });
    }

    // Stats finales
    const empCount = await Employe.countDocuments({});
    const userCount = await User.countDocuments({});
    
    console.log(`\n📈 État de la base:`);
    console.log(`  • Employés total: ${empCount}`);
    console.log(`  • Utilisateurs: ${userCount}`);

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
};

console.log('════════════════════════════════════════════════════════════');
console.log('📥 IMPORT DE DONNÉES EXCEL VERS MONGODB');
console.log('════════════════════════════════════════════════════════════\n');

importData();
