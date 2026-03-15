const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

// Importer tous les modèles
const User = require('./models/User');
const Employe = require('./models/Employe');
const Pointage = require('./models/Pointage');
const Service = require('./models/Service');
const UAP = require('./models/UAP');
const Conge = require('./models/Conge');
const Salaire = require('./models/Salaire');
const AuditLog = require('./models/AuditLog');
const Notification = require('./models/Notification');
const StageRequest = require('./models/StageRequest'); // Even if unused, clear it
const Discipline = require('./models/Discipline'); // Even if unused, clear it
const Prime = require('./models/Prime'); // Even if unused, clear it

// ============================================
// DONNÉES DE BASE
// ============================================

const STRUCTURE = [
  { service: 'Informatique', uaps: ['Dev-Web', 'Infra-Reseau', 'Support-IT'] },
  { service: 'Ressources Humaines', uaps: ['Recrutement', 'Paie', 'Formation'] },
  { service: 'Finance', uaps: ['Comptabilite', 'Controle-Gestion'] },
  { service: 'Commerce', uaps: ['Ventes-Directes', 'Marketing', 'B2B'] }
];

const PRENOMS_H = ['Ahmed', 'Karim', 'Youssef', 'Amine', 'Mehdi', 'Omar', 'Ali', 'Sami', 'Hassan', 'Brahim'];
const PRENOMS_F = ['Fatima', 'Sara', 'Amina', 'Meriem', 'Nour', 'Khadija', 'Imane', 'Salma', 'Leila', 'Zineb'];
const NOMS = ['Benali', 'Tahiri', 'Alaoui', 'Filali', 'Mansouri', 'Idrissi', 'Touzani', 'Bennani', 'Tazi', 'Chraibi', 'El Amrani', 'Zerouali'];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomBool = (chanceTrue = 0.5) => Math.random() < chanceTrue;

// Générateur d'employé aléatoire
const usedEmails = new Set();

const generateEmployee = (role, sexe, serviceId, uapId, matricule) => {
  const prenom = sexe === 'H' ? randomItem(PRENOMS_H) : randomItem(PRENOMS_F);
  const nom = randomItem(NOMS);
  let email = `${prenom.toLowerCase()}.${nom.toLowerCase()}@rh.app`.replace(/[^a-z0-9.@]/g, '');

  while (usedEmails.has(email)) {
    email = `${prenom.toLowerCase()}.${nom.toLowerCase()}${randomInt(1, 999)}@rh.app`.replace(/[^a-z0-9.@]/g, '');
  }
  usedEmails.add(email);

  let prixHeure = randomInt(350, 500); // base
  if (role === 'chef_service') prixHeure = randomInt(550, 750);
  if (role === 'admin') prixHeure = randomInt(700, 900);

  return {
    nom, prenom, matricule, email, telephone: `06${randomInt(10000000, 99999999)}`,
    service: serviceId, uap: uapId,
    date_embauche: new Date(randomInt(2018, 2023), randomInt(0, 11), randomInt(1, 28)),
    prix_heure: prixHeure, role, password: 'Password123!',
    solde_conge_total: role === 'chef_service' || role === 'admin' ? 25 : 22,
    sexe,
    adresse: `${randomInt(1, 150)}, ${randomItem(['Avenue Habib Bourguiba', 'Rue de la Liberté', 'Avenue de Carthage', 'Rue de Palestine', 'Avenue de la République', 'Rue de Marseille', 'Cité El Ghazala', 'Les Berges du Lac'])}, ${randomItem(['Tunis', 'Sfax', 'Sousse', 'Ariana', 'Bizerte', 'Gabès', 'Kairouan', 'Gafsa', 'Monastir', 'Ben Arous'])}, Tunisie`
  };
};

// ============================================
// GÉNÉRATEURS DE DONNÉES FONCTIONNELLES
// ============================================

const generatePointages = async (employe_id, startAnnee, endAnnee, endMois = 11) => {
  const pointages = [];
  const today = new Date();

  for (let annee = startAnnee; annee <= endAnnee; annee++) {
    const debut = new Date(annee, 0, 1);
    const fin = new Date(annee, annee === endAnnee ? endMois : 11, 31);

    for (let d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) {
      if (d > today) break;

      const jour = d.getDay();
      if (jour === 0 || jour === 6) continue; // Skip weekends

      // 4% Absence
      if (randomBool(0.04)) {
        pointages.push({ employe: employe_id, date: new Date(d), absence: true, motif_absence: randomBool(0.5) ? 'Maladie' : '', heure_entree: '00:00', heure_sortie: '00:00', heures_travaillees: 0, heures_supp: 0 });
      }
      // 8% Retard
      else if (randomBool(0.08)) {
        const minutesRetard = randomInt(10, 45);
        const heuresTravaillees = 8 - (minutesRetard / 60);
        pointages.push({ employe: employe_id, date: new Date(d), absence: false, heure_entree: `09:${minutesRetard.toString().padStart(2, '0')}`, heure_sortie: '17:30', heures_travaillees: heuresTravaillees.toFixed(2), heures_supp: 0, retard_minutes: minutesRetard });
      }
      // Journée normale
      else {
        const heuresSupp = randomBool(0.15) ? randomItem([0.5, 1, 1.5, 2]) : 0;
        const heuresTravaillees = 8 + heuresSupp;

        let sortieMinutes = 30 + (heuresSupp * 60);
        let sortieHeures = 17 + Math.floor(sortieMinutes / 60);
        sortieMinutes = sortieMinutes % 60;

        pointages.push({ employe: employe_id, date: new Date(d), absence: false, heure_entree: '09:00', heure_sortie: `${sortieHeures}:${sortieMinutes.toString().padStart(2, '0')}`, heures_travaillees: heuresTravaillees, heures_supp: heuresSupp, retard_minutes: 0 });
      }
    }
  }
  return pointages;
};

const generatePrimes = async (employe_id) => {
  const primes = [];
  const types = ['performance', 'assiduité', 'productivité'];
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // Generate primes for 2024 and 2025 until now
  for (let annee = 2024; annee <= currentYear; annee++) {
    const startMois = 1;
    const limitMois = annee === currentYear ? currentMonth : 12;

    for (let mois = startMois; mois <= limitMois; mois++) {
      // 30% chance of having a prime each month
      if (randomBool(0.3)) {
        const type = randomItem(types);
        const montant = randomInt(50, 300);
        primes.push({
          employe: employe_id,
          montant: montant,
          date: new Date(annee, mois - 1, 15),
          type: type,
          description: `Prime de ${type} du mois ${mois}/${annee}`,
          mois: mois,
          annee: annee
        });
      }
    }
  }
  return primes;
};

const generateConges = async (employe_id, employeRef, soldesRef) => {
  const conges = [];
  const types = ['annuel', 'maladie', 'maternite', 'paternite', 'autre'];
  let remainingSolde = soldesRef;
  const today = new Date();

  // Generate for 2024 and 2025
  for (let annee of [2024, 2025]) {
    const nbDemandes = randomInt(1, 3);
    for (let i = 0; i < nbDemandes; i++) {
      const type = randomBool(0.7) ? 'annuel' : randomItem(['maladie', 'autre']);
      const duree = type === 'annuel' ? randomInt(2, 10) : randomInt(1, 3);
      if (type === 'annuel' && remainingSolde < duree) continue;

      const mois = randomInt(0, annee === today.getFullYear() ? today.getMonth() : 11);
      const dateDebut = new Date(annee, mois, randomInt(1, 20));
      if (dateDebut > today) continue;

      const dateFin = new Date(dateDebut);
      dateFin.setDate(dateFin.getDate() + duree - 1);

      const statut = randomBool(0.8) ? 'approuve' : randomBool(0.5) ? 'refuse' : 'demande';
      if (statut === 'approuve' && type === 'annuel') remainingSolde -= duree;

      conges.push({
        employe: employe_id,
        date_debut: dateDebut,
        date_fin: dateFin,
        type: type,
        motif: type === 'maladie' ? 'Certificat médical fourni' : 'Congé de repos',
        statut: statut,
        nombre_jours: duree,
        commentaire_rejet: statut === 'refuse' ? 'Effectif insuffisant sur cette période' : ''
      });
    }
  }
  return { conges, remainingSolde };
};

// ============================================
// MAIN SEED SCRIPT
// ============================================

const seedDatabase = async () => {
  try {
    console.log('\n=============================================');
    console.log('🚀 DÉMARRAGE DU SUPER SEED AMÉLIORÉ');
    console.log('=============================================\n');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pfe');
    console.log('✅ [1/6] Connecté à MongoDB');

    // 1. CLEAR TOUT
    console.log('🧹 [2/6] Nettoyage complet des collections...');
    const collections = [User, Employe, Pointage, Service, UAP, Conge, Salaire, AuditLog, Notification, StageRequest, Discipline, Prime];
    for (const model of collections) {
      if (mongoose.models[model.modelName]) {
        await model.deleteMany({});
      }
    }
    console.log('   ✅ Collections vidées');

    // 2. CRÉATION STRUCTURE
    console.log('🏢 [3/6] Génération Structure de l\'entreprise...');
    const servicesDB = [];
    const uapsDB = [];
    for (const struct of STRUCTURE) {
      const s = await Service.create({ nom_service: struct.service });
      servicesDB.push(s);
      for (const nomUap of struct.uaps) {
        const u = await UAP.create({ nom_uap: nomUap, service: s._id });
        uapsDB.push(u);
      }
    }

    // 3. CRÉATION PERSONNEL
    console.log('👥 [4/6] Génération et embauche du personnel...');
    const allEmployees = [];
    const allUsers = [];
    let matCounter = 1000;

    const createEmployeDB = async (data) => {
      const e = await Employe.create({
        nom: data.nom, prenom: data.prenom, matricule: data.matricule, telephone: data.telephone,
        service: data.service, uap: data.uap, date_embauche: data.date_embauche,
        prix_heure: data.prix_heure, solde_conge_total: data.solde_conge_total, solde_conge_restant: data.solde_conge_total,
        adresse: data.adresse, sexe: data.sexe
      });
      const u = await User.create({ email: data.email, password: data.password, role: data.role, employe: e._id });
      e.user = u._id;
      await e.save();
      allEmployees.push(e);
      allUsers.push({ user: u, rawPassword: data.password });
      return { employe: e, user: u };
    };

    await User.create({ email: 'superadmin@rh.app', password: 'SuperAdmin123!', role: 'super_admin' });

    // Admins
    const hrService = servicesDB.find(s => s.nom_service === 'Ressources Humaines');
    for (let i = 0; i < 2; i++) {
      const data = generateEmployee('admin', randomBool() ? 'H' : 'F', hrService._id, randomItem(uapsDB)._id, `EMP${matCounter++}`);
      if (i === 0) data.email = 'admin@rh.app';
      await createEmployeDB(data);
    }

    // Chefs & Employés
    for (const s of servicesDB) { await createEmployeDB(generateEmployee('chef_service', randomBool() ? 'H' : 'F', s._id, randomItem(uapsDB)._id, `EMP${matCounter++}`)); }
    for (let i = 0; i < 30; i++) {
      const data = generateEmployee('employe', randomBool() ? 'H' : 'F', randomItem(servicesDB)._id, randomItem(uapsDB)._id, `EMP${matCounter++}`);
      if (i === 0) data.email = 'employe@rh.app';
      await createEmployeDB(data);
    }

    // 4. HISTORIQUE
    console.log('\n⏳ [5/6] Simulation de l\'historique (Pointages, Congés, Primes)...');
    let totalP = 0, totalC = 0, totalPrimes = 0;

    for (const emp of allEmployees) {
      // Historical Pointages (2024 -> Today)
      const pHistory = await generatePointages(emp._id, 2024, new Date().getFullYear(), new Date().getMonth());
      await Pointage.insertMany(pHistory);
      totalP += pHistory.length;

      // Primes
      const primes = await generatePrimes(emp._id);
      if (primes.length > 0) {
        await Prime.insertMany(primes);
        totalPrimes += primes.length;
      }

      // Congés
      const { conges, remainingSolde } = await generateConges(emp._id, emp, emp.solde_conge_total);
      if (conges.length > 0) { await Conge.insertMany(conges); totalC += conges.length; }
      emp.solde_conge_restant = remainingSolde;
      await emp.save();
    }

    console.log(`   ✅ ${totalP} Pointages générés`);
    console.log(`   ✅ ${totalPrimes} Primes générées`);
    console.log(`   ✅ ${totalC} Congés générés`);

    // 5. NOTIFICATIONS
    console.log('🔔 [6/6] Finalisation...');
    process.exit(0);
    const auditLogs = [];
    const notifications = [];

    for (let i = 0; i < 30; i++) {
      const u = randomItem(allUsers);
      auditLogs.push({
        user: u.user._id,
        action: randomItem(['view', 'update', 'create', 'delete']),
        module: randomItem(['Authentification', 'Employés', 'Congés', 'Pointages']),
        description: 'Action générée automatiquement par le super seed.',
        status: randomBool(0.9) ? 'success' : 'failure',
        date_action: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000)
      });

      notifications.push({
        user: u.user._id, // Add this required field
        destinataire: u.user._id,
        type: randomItem(['conge_demande', 'conge_approuve', 'conge_refuse', 'salaire_disponible', 'autre']),
        titre: 'Notification Système',
        message: 'Ceci est une notification de test générée par le système.',
        lu: randomBool(0.4),
        date_creation: new Date(Date.now() - randomInt(0, 10) * 24 * 60 * 60 * 1000)
      });
    }
    await AuditLog.insertMany(auditLogs);
    await Notification.insertMany(notifications);
    console.log(`   ✅ ${auditLogs.length} logs d'audit et ${notifications.length} notifications créés`);


    console.log('\n=============================================');
    console.log('🎉 SUPER SEED TERMINÉ AVEC SUCCÈS !');
    console.log('=============================================\n');
    console.log('📋 COMPTES TEST PRINCIPAUX :');
    console.log('   👑 Super Admin : superadmin@rh.app / SuperAdmin123!');
    console.log('   🔐 Admin RH     : admin@rh.app / Password123!');
    console.log('   👤 Employé      : employe@rh.app / Password123!');
    console.log('\n(Tous les autres comptes générés ont le mot de passe: Password123!)');
    console.log('=============================================\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ ERREUR FATALE DURANT LE SEED:', error);
    process.exit(1);
  }
};

seedDatabase();
