/**
 * Script de Nettoyage Complet - Supprime toutes les données
 * Garde seulement le compte Super Admin
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./backend/models/User');
const Employe = require('./backend/models/Employe');
const Pointage = require('./backend/models/Pointage');
const Conge = require('./backend/models/Conge');
const Salaire = require('./backend/models/Salaire');
const Prime = require('./backend/models/Prime');
const AuditLog = require('./backend/models/AuditLog');
const Notification = require('./backend/models/Notification');
const DocumentRequest = require('./backend/models/DocumentRequest');
const Discipline = require('./backend/models/Discipline');
const StageRequest = require('./backend/models/StageRequest');
const ZkLog = require('./backend/models/ZkLog');
const PushSubscription = require('./backend/models/PushSubscription');

// DW Models
const DW_FactAttendance = require('./backend/models/DW_FactAttendance');
const DW_FactSalary = require('./backend/models/DW_FactSalary');
const DW_DimEmploye = require('./backend/models/DW_DimEmploye');

const cleanDatabase = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté\n');

    // 1. Supprimer toutes les données
    console.log('🗑️  SUPPRESSION DE TOUTES LES DONNÉES...\n');
    
    console.log('Suppression des pointages...');
    await Pointage.deleteMany({});
    console.log('✅ Pointages supprimés');

    console.log('Suppression des congés...');
    await Conge.deleteMany({});
    console.log('✅ Congés supprimés');

    console.log('Suppression des salaires...');
    await Salaire.deleteMany({});
    console.log('✅ Salaires supprimés');

    console.log('Suppression des primes...');
    await Prime.deleteMany({});
    console.log('✅ Primes supprimées');

    console.log('Suppression des disciplines...');
    await Discipline.deleteMany({});
    console.log('✅ Disciplines supprimées');

    console.log('Suppression des demandes de congé...');
    await StageRequest.deleteMany({});
    console.log('✅ Demandes de stage supprimées');

    console.log('Suppression des demandes de documents...');
    await DocumentRequest.deleteMany({});
    console.log('✅ Demandes de documents supprimées');

    console.log('Suppression des journaux d\'audit...');
    await AuditLog.deleteMany({});
    console.log('✅ Journaux d\'audit supprimés');

    console.log('Suppression des notifications...');
    await Notification.deleteMany({});
    console.log('✅ Notifications supprimées');

    console.log('Suppression des logs ZK...');
    await ZkLog.deleteMany({});
    console.log('✅ Logs ZK supprimés');

    console.log('Suppression des souscriptions Push...');
    await PushSubscription.deleteMany({});
    console.log('✅ Souscriptions Push supprimées');

    console.log('Suppression des employés...');
    await Employe.deleteMany({});
    console.log('✅ Employés supprimés');

    // Data Warehouse
    console.log('Suppression des faits d\'attendance (DW)...');
    await DW_FactAttendance.deleteMany({});
    console.log('✅ FactAttendance supprimés');

    console.log('Suppression des faits de salaire (DW)...');
    await DW_FactSalary.deleteMany({});
    console.log('✅ FactSalary supprimés');

    console.log('Suppression des dimensions d\'employé (DW)...');
    await DW_DimEmploye.deleteMany({});
    console.log('✅ DimEmploye supprimés');

    console.log('Suppression des autres utilisateurs...');
    // Supprimer tous les users sauf super admin
    await User.deleteMany({});
    console.log('✅ Utilisateurs supprimés\n');

    // 2. Créer le compte Super Admin
    console.log('🔐 CRÉATION DU COMPTE SUPER ADMIN...\n');
    
    const superAdmin = await User.create({
      email: 'superadmin@rh.app',
      password: 'SuperAdmin123!',
      role: 'super_admin'
    });

    console.log('✅ Super Admin créé:');
    console.log(`   Email: superadmin@rh.app`);
    console.log(`   Password: SuperAdmin123!`);
    console.log(`   Role: super_admin\n`);

    // 3. Résumé
    console.log('=====================================');
    console.log('✅ NETTOYAGE COMPLET TERMINÉ!');
    console.log('=====================================\n');

    console.log('📊 État de la base:');
    const empCount = await Employe.countDocuments({});
    const userCount = await User.countDocuments({});
    const pointageCount = await Pointage.countDocuments({});
    const salaireCount = await Salaire.countDocuments({});
    const notifCount = await Notification.countDocuments({});

    console.log(`  • Employés: ${empCount}`);
    console.log(`  • Utilisateurs: ${userCount} (Super Admin uniquement)`);
    console.log(`  • Pointages: ${pointageCount}`);
    console.log(`  • Salaires: ${salaireCount}`);
    console.log(`  • Notifications: ${notifCount}`);

    console.log('\n✅ La base est maintenant vierge. Vous pouvez créer de nouvelles données.\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Confirm before deleting
console.log('⚠️  ATTENTION: Ce script va SUPPRIMER TOUTES LES DONNÉES!');
console.log('=====================================');
console.log('Les données affectées:');
console.log('  • ✂️  Tous les employés');
console.log('  • ✂️  Tous les pointages');
console.log('  • ✂️  Tous les salaires');
console.log('  • ✂️  Tous les congés');
console.log('  • ✂️  Tous les documents');
console.log('  • ✂️  Tous les utilisateurs (sauf super admin)');
console.log('  • ✂️  Tous les logs et notifications');
console.log('  • ✂️  Data Warehouse (DW)');
console.log('=====================================\n');

console.log('⏳ Démarrage du script...\n');
setTimeout(cleanDatabase, 1000);
