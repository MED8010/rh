/**
 * Script d'importation robuste des données Excel vers MongoDB
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

    // Lire le fichier Excel en utilisant l'approche raw
    console.log('📖 Lecture du fichier Excel...');
    const workbook = XLSX.readFile(filePath);
    const sheetName = 'demissionnaire 2025';
    const worksheet = workbook.Sheets[sheetName];
    
    // Obtenir les données brutes avec les noms de colonnes
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    
    console.log(`✅ ${data.length} lignes lues\n`);

    // Afficher le mapping des colonnes
    if (data.length > 2) {
      console.log('📋 Colonnes trouvées (premier enregistrement):');
      const firstDataRow = data[2];
      Object.keys(firstDataRow).forEach((key, idx) => {
        if (idx < 10) console.log(`  ${key}: ${firstDataRow[key]}`);
      });
      console.log('  ...\n');
    }

    // Récupérer ou créer les services/UAPs
    console.log('Préparation des services et UAPs...');
    let services = await Service.find({});
    let uaps = await UAP.find({});

    if (services.length === 0) {
      services = await Service.insertMany([
        { nom_service: 'Production' },
        { nom_service: 'Maintenance' },
        { nom_service: 'Qualité' },
        { nom_service: 'Administration' },
        { nom_service: 'Ressources Humaines' }
      ]);
    }

    if (uaps.length === 0) {
      uaps = await UAP.insertMany([
        { nom: 'UAP 1', service: services[0]._id },
        { nom: 'UAP 2', service: services[0]._id },
        { nom: 'UAP 3', service: services[1]._id }
      ]);
    }

    console.log(`✅ ${services.length} services, ${uaps.length} UAPs prêts\n`);

    // Traiter les employés
    console.log('🔄 Importation des employés...\n');
    let createdCount = 0;
    let errors = [];

    for (let idx = 2; idx < data.length; idx++) {
      const row = data[idx];
      
      // Vérifier que c'est une vraie données (pas header)
      if (!row || !row['__EMPTY_1'] || typeof row['__EMPTY_1'] === 'string' && row['__EMPTY_1'] === 'MAT') {
        continue;
      }

      try {
        // Extraire les données -  sécurisé
        const matricule = String(cleanValue(row['__EMPTY_1']) || `EMP${Date.now()}`).trim();
        const prenom = cleanValue(row['__EMPTY_2']) || 'Prénom';
        const nom = cleanValue(row['4/6/26']) || 'Nom';
        const sexe = String(cleanValue(row['__EMPTY_22']) || 'H').charAt(0).toUpperCase() === 'F' ? 'F' : 'H';
        const email = (cleanValue(row['__EMPTY_4']) || `${matricule.toLowerCase()}@company.com`).toLowerCase();
        
        // Dates
        const dateNaissance = excelDateToJSDate(row['__EMPTY_18']);
        const dateEmbauche = excelDateToJSDate(row['__EMPTY_25']) || 
                             excelDateToJSDate(row['__EMPTY_15']) ||
                             new Date();
        
        // Salaire
        let prixHeure = parseFloat(row['__EMPTY_46']);
        if (isNaN(prixHeure)) prixHeure = 4.0;
        
        // Service - sécurisé - SERVICE MAPPING
        console.log(`  Processing row ${idx}: MAT=${matricule}, STE_RAW=${row['__EMPTY_7']}`);
        
        let serviceName = cleanValue(row['__EMPTY_7']) || 'Production';
        console.log(`  Service found: ${serviceName}, Available services: ${services.map(s => s.nom_service).join(',')}`);
        
        let service = services.find(s => {
          const matches = serviceName.toLowerCase().includes(s.nom_service.toLowerCase()) ||
                        s.nom_service.toLowerCase().includes(serviceName.toLowerCase());
          console.log(`    Comparing "${serviceName}" with "${s.nom_service}": ${matches}`);
          return matches;
        }) || services[0];
        
        console.log(`  Selected service: ${service.nom_service}`);
        
        // Reste du code
        const existing = await Employe.findOne({ matricule });
        if (existing) {
          errors.push({ row: idx, matricule, error: 'Déjà existe' });
          continue;
        }

        // Créer User si nécessaire
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            email,
            password: 'Temp123456',
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
          matricule: row['__EMPTY_1'],
          error: error.message
        });
        console.log(`  ❌ ERROR at row ${idx}: ${error.message}`);
        console.log(`     Stack: ${error.stack.split('\n')[1]}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ IMPORTATION TERMINÉE!');
    console.log('='.repeat(60));
    console.log(`\n📊 Résultats:`);
    console.log(`  • Employés importés: ${createdCount}`);
    console.log(`  • Erreurs: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log(`\n⚠️  Erreurs (max 5 affichées):`);
      errors.slice(0, 5).forEach(e => {
        console.log(`  Ligne ${e.row} (${e.matricule}): ${e.error}`);
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
    console.error('❌ Erreur fatale:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
};

console.log('════════════════════════════════════════════════════════════');
console.log('📥 IMPORT DE DONNÉES EXCEL VERS MONGODB');
console.log('════════════════════════════════════════════════════════════\n');

importData();
