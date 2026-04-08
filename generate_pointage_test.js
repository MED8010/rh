/**
 * Génère un fichier Excel de test pour les pointages
 */

const XLSX = require('xlsx');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Employe = require('./backend/models/Employe');

const generateTestPointages = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté\n');

    // Récupérer les employés existants
    console.log('📖 Lecture des employés...');
    const employes = await Employe.find({}).select('matricule prenom nom');
    console.log(`✅ ${employes.length} employés trouvés\n`);

    if (employes.length === 0) {
      console.log('❌ Aucun employé dans la base');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Créer des données de test
    console.log('🔄 Génération des données de test...');
    const data = [];
    const today = new Date();

    for (let i = 0; i < Math.min(employes.length, 10); i++) {
      const emp = employes[i];
      
      // Créer 5 jours de pointage pour chaque employé
      for (let day = 0; day < 5; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (5 - day - 1));

        const row = {
          'Matricule': emp.matricule,
          'Prénom': emp.prenom,
          'Nom': emp.nom,
          'Date': date.toLocaleDateString('fr-FR'),
          'Heure Entrée': day % 3 === 0 ? '08:15' : '08:00', // Le jour 0, 3... 8:15 (retard)
          'Heure Sortie': '17:00',
          'Absence': day % 5 === 0 ? 'OUI' : 'NON', // Le 5e jour: absent
          'Motif Absence': day % 5 === 0 ? 'Maladie' : '',
          'Retard (min)': day % 3 === 0 ? 15 : 0,
          'Source': 'manual'
        };
        data.push(row);
      }
    }

    console.log(`✅ ${data.length} lignes de pointage générées\n`);

    // Créer le fichier Excel
    console.log('💾 Création du fichier Excel...');
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pointages');

    // Ajouter une feuille d'instructions
    const instructions = [
      { 'Instructions': 'Comment remplir le fichier' },
      { 'Colonne': 'Description' },
      { 'Matricule': 'Code employé (obligatoire)' },
      { 'Date': 'Format: DD/MM/YYYY' },
      { 'Heure Entrée': 'Format: HH:MM (ex: 08:30)' },
      { 'Heure Sortie': 'Format: HH:MM (ex: 17:00)' },
      { 'Absence': 'OUI ou NON' },
      { 'Motif Absence': 'Raison si applicable' },
      { 'Retard (min)': 'Nombre de minutes' },
      { 'Source': 'manual ou biometric' }
    ];

    const notesSheet = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, notesSheet, 'Instructions');

    // Sauvegarder le fichier
    const filename = 'Pointage_Test.xlsx';
    XLSX.writeFile(wb, filename);

    console.log(`✅ Fichier créé: ${filename}\n`);

    console.log('🎯 Instructions d\'importation:');
    console.log('  1. Allez à la page Pointages');
    console.log('  2. Cliquez sur le bouton "📥 Importer Pointages"');
    console.log('  3. Sélectionnez le fichier Pointage_Test.xlsx');
    console.log('  4. Cliquez sur "Importer"');
    console.log('  5. Les pointages seront ajoutés à la base\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

console.log('════════════════════════════════════════════════════════════');
console.log('📥 GÉNÉRATEUR DE FICHIER DE POINTAGE TEST');
console.log('════════════════════════════════════════════════════════════\n');

generateTestPointages();
