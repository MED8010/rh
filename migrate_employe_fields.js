/**
 * Script de Migration pour ajouter les champs manquants aux employés existants
 * - sexe (par défaut 'H')
 * - date_naissance (calculée en supposant 25 ans à l'embauche)
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Employe = require('./backend/models/Employe');

const migrateEmployees = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté\n');

    // 1. Ajouter sexe par défaut
    console.log('--- Étape 1: Migration du champ "sexe" ---');
    const employesSansS= await Employe.find({ sexe: { $in: [null, undefined] } });
    console.log(`Found ${employesSansS.length} employees without sexe field`);

    if (employesSansS.length > 0) {
      await Employe.updateMany(
        { sexe: { $in: [null, undefined] } },
        { $set: { sexe: 'H' } }
      );
      console.log(`✅ Mis à jour ${employesSansS.length} employés with default sexe='H'\n`);
    } else {
      console.log('✅ Tous les employés ont le champ sexe\n');
    }

    // 2. Ajouter date_naissance par défaut (calculée)
    console.log('--- Étape 2: Migration du champ "date_naissance" ---');
    const employes = await Employe.find({});
    let updated = 0;

    for (const emp of employes) {
      if (!emp.date_naissance && emp.date_embauche) {
        // Calculer date_naissance en supposant 25 ans d'expérience minimum
        const birthDate = new Date(emp.date_embauche);
        birthDate.setFullYear(birthDate.getFullYear() - 25);
        
        emp.date_naissance = birthDate;
        await emp.save();
        updated++;
      }
    }
    
    console.log(`✅ Mis à jour ${updated} employés with calculated date_naissance\n`);

    // 3. Vérifier les résultats
    console.log('--- Vérification Final ---');
    const finalCount = await Employe.countDocuments({});
    const withSexe = await Employe.countDocuments({ sexe: { $ne: null } });
    const withBirth = await Employe.countDocuments({ date_naissance: { $ne: null } });

    console.log(`Total employés: ${finalCount}`);
    console.log(`Avec sexuality: ${withSexe}/${finalCount}`);
    console.log(`Avec date_naissance: ${withBirth}/${finalCount}`);

    if (withSexe === finalCount && withBirth === finalCount) {
      console.log('\n✅ Migration réussie! Tous les champs requis sont remplis.');
    } else {
      console.log('\n⚠️  Migration partielle - certains champs manquent toujours');
    }

    await mongoose.disconnect();
    console.log('\n✅ Migration terminée');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

migrateEmployees();
