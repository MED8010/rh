/**
 * Générateur de données 3 ans (2024, 2025, 2026)
 * Crée des pointages, salaires, primes et congés réalistes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Employe = require('./backend/models/Employe');
const Pointage = require('./backend/models/Pointage');
const Salaire = require('./backend/models/Salaire');
const Prime = require('./backend/models/Prime');
const Conge = require('./backend/models/Conge');
const PrimeType = require('./backend/models/PrimeType');

// Heures standard de travail
const HEURES_PAR_JOUR = 8;
const JOURS_TRAVAIL_SEMAINE = 5;
const HEURES_PAR_SEMAINE = 40;

// Motifs d'absence
const MOTIFS_ABSENCE = ['Maladie', 'Congé personnel', 'Excusé', 'Raison personnelle'];

// Types de congés
const TYPES_CONGES = ['annuel', 'maladie', 'autre'];

// Fonction pour obtenir les jours ouvrables du mois
const getJoursOuvrables = (year, month) => {
  const date = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const joursOuvrables = [];

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Pas dimanche ni samedi
      joursOuvrables.push(new Date(year, month, day));
    }
  }
  
  return joursOuvrables;
};

// Générer pointages réalistes
const genererPointages = async (employe, year, month) => {
  const joursOuvrables = getJoursOuvrables(year, month);
  const pointages = [];

  for (const date of joursOuvrables) {
    // 90% de présence, 10% d'absence
    const isAbsent = Math.random() < 0.10;
    
    if (isAbsent) {
      pointages.push({
        employe: employe._id,
        date: new Date(date),
        heure_entree: '08:00',
        absence: true,
        motif_absence: MOTIFS_ABSENCE[Math.floor(Math.random() * MOTIFS_ABSENCE.length)],
        heures_travaillees: 0,
        heures_supp: 0,
        retard_minutes: 0,
        validee: true,
        source: 'manual'
      });
    } else {
      // Génération d'un pointage normal
      const entree = ['08:00', '08:15', '07:45'][Math.floor(Math.random() * 3)];
      let retard = 0;
      if (entree !== '08:00') {
        retard = Math.abs(new Date(`2000-01-01 ${entree}`) - new Date('2000-01-01 08:00')) / 60000;
      }

      // 5% de chance heures supplémentaires
      const heuresSup = Math.random() < 0.05 ? 1 + Math.random() * 2 : 0;
      const heureTravail = HEURES_PAR_JOUR + heuresSup;

      // Heure de sortie
      const entreeHour = parseInt(entree.split(':')[0]);
      const sortieHour = entreeHour + heureTravail + (retard / 60);
      const sortie = `${String(Math.floor(sortieHour)).padStart(2, '0')}:00`;

      pointages.push({
        employe: employe._id,
        date: new Date(date),
        heure_entree: entree,
        heure_sortie: sortie,
        heures_travaillees: heureTravail,
        heures_supp: heuresSup,
        retard_minutes: retard,
        absence: false,
        validee: true,
        source: 'manual'
      });
    }
  }

  return pointages;
};

// Calculer salaire du mois
const calculerSalaire = async (employe, pointages, month, year, primeTypes) => {
  const absences = pointages.filter(p => p.absence).length;
  const heuresNormales = pointages.reduce((sum, p) => sum + (p.heures_travaillees - p.heures_supp), 0);
  const heuresSup = pointages.reduce((sum, p) => sum + p.heures_supp, 0);
  
  const prixHeure = employe.prix_heure || 100;
  const salaireBase = heuresNormales * prixHeure;
  const salaireSupp = heuresSup * prixHeure * 1.5; // Heures supplémentaires à 150%
  
  // Déduction pour absences (8h par absence)
  const absDeduction = absences * HEURES_PAR_JOUR * prixHeure;

  // Ajouter primes (50% de chance)
  let primesTotal = 0;
  if (Math.random() < 0.5 && primeTypes.length > 0) {
    const primeType = primeTypes[Math.floor(Math.random() * primeTypes.length)];
    const montantPrime = primeType.montant_par_defaut * (0.8 + Math.random() * 0.4); // ±20%
    primesTotal = montantPrime;

    // Créer enregistrement Prime
    await Prime.create({
      employe: employe._id,
      montant: montantPrime,
      type_prime: primeType._id,
      mois: month + 1,
      annee: year,
      date: new Date(year, month, 15),
      statut: 'payé',
      description: `Prime ${primeType.nom}`
    });
  }

  const salaireBrut = salaireBase + salaireSupp + primesTotal - absDeduction;
  const cotisations = salaireBrut * 0.1; // 10% cotisations
  const salaireNet = salaireBrut - cotisations;

  return {
    employe: employe._id,
    mois: month + 1,
    annee: year,
    heures_normales: heuresNormales,
    heures_supp: heuresSup,
    prix_heure: prixHeure,
    salaire_base: salaireBase,
    primes_total: primesTotal,
    deductions: 0,
    absences_deductions: absDeduction,
    cotisations_sociales: cotisations,
    autres_deductions: 0,
    salaire_brut: salaireBrut,
    salaire_net: salaireNet,
    nombre_absences: absences,
    nombre_retards: pointages.filter(p => p.retard_minutes > 0).length,
    nombre_heures_supp: heuresSup,
    validee: true
  };
};

// Générer congés
const genererConges = async (employe, year) => {
  const conges = [];
  
  // 20 jours de congé annuel
  const joursCongesAnnuel = 20;
  const joursCongesDeja = [];

  // Générer 4-5 périodes de congé pendant l'année
  const nombrePeriodes = 4 + Math.floor(Math.random() * 2);
  
  for (let i = 0; i < nombrePeriodes; i++) {
    const month = Math.floor(Math.random() * 12);
    const joursOuvrables = getJoursOuvrables(year, month);
    
    if (joursOuvrables.length > 0) {
      const startIdx = Math.floor(Math.random() * (joursOuvrables.length - 3));
      const nombreJours = 3 + Math.floor(Math.random() * 4); // 3-7 jours
      
      const dateDebut = joursOuvrables[startIdx];
      const dateFin = joursOuvrables[Math.min(startIdx + nombreJours - 1, joursOuvrables.length - 1)];

      conges.push({
        employe: employe._id,
        date_debut: new Date(dateDebut),
        date_fin: new Date(dateFin),
        type: TYPES_CONGES[Math.floor(Math.random() * TYPES_CONGES.length)],
        nombre_jours: nombreJours,
        statut: 'approuve',
        motif: 'Congé approuvé'
      });
    }
  }

  return conges;
};

async function generate3YearsData() {
  try {
    console.log('════════════════════════════════════════════════════════════');
    console.log('📊 GÉNÉRATEUR DE DONNÉES 3 ANS (2024-2026)');
    console.log('════════════════════════════════════════════════════════════\n');

    // Connexion
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connexion MongoDB établie\n');

    // Récupérer les employés
    const employes = await Employe.find();
    console.log(`📖 ${employes.length} employés trouvés\n`);

    // Récupérer les types de primes
    const primeTypes = await PrimeType.find({ isActive: true });
    console.log(`💰 ${primeTypes.length} types de primes disponibles\n`);

    // Stats
    let totalPointages = 0;
    let totalSalaires = 0;
    let totalPrimes = 0;
    let totalConges = 0;

    // Pour chaque année
    for (const year of [2024, 2025, 2026]) {
      console.log(`\n🗓️  ANNÉE ${year}:`);
      console.log('─'.repeat(60));

      for (const employe of employes) {
        const pointagesAnnuel = [];
        const salairesAnnuel = [];
        const congesAnnuel = [];

        // Pour chaque mois
        for (let month = 0; month < 12; month++) {
          // Générer pointages
          const pointages = await genererPointages(employe, year, month);
          pointagesAnnuel.push(...pointages);

          // Créer salaire
          const salaire = await calculerSalaire(employe, pointages, month, year, primeTypes);
          salairesAnnuel.push(salaire);
        }

        // Générer congés annuels
        const conges = await genererConges(employe, year);
        congesAnnuel.push(...conges);

        // Insertion en masse
        if (pointagesAnnuel.length > 0) {
          await Pointage.insertMany(pointagesAnnuel);
          totalPointages += pointagesAnnuel.length;
        }

        if (salairesAnnuel.length > 0) {
          await Salaire.insertMany(salairesAnnuel);
          totalSalaires += salairesAnnuel.length;
        }

        if (congesAnnuel.length > 0) {
          await Conge.insertMany(congesAnnuel);
          totalConges += congesAnnuel.length;
        }

        console.log(`  ✅ ${employe.nom} - ${pointagesAnnuel.length} pointages, ${salairesAnnuel.length} salaires, ${congesAnnuel.length} congés`);
      }
    }

    // Récupérer le nombre total de primes
    const totalPrimesDb = await Prime.countDocuments();

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ DE GÉNÉRATION');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`✅ Pointages générés: ${totalPointages.toLocaleString()}`);
    console.log(`✅ Salaires générés: ${totalSalaires.toLocaleString()}`);
    console.log(`✅ Primes générées: ${totalPrimesDb.toLocaleString()}`);
    console.log(`✅ Congés générés: ${totalConges.toLocaleString()}`);
    console.log(`\n📈 Total sous la base de données: ${(totalPointages + totalSalaires + totalPrimesDb + totalConges).toLocaleString()} enregistrements`);

    await mongoose.connection.close();
    console.log('\n✅ Génération complétée avec succès!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

generate3YearsData();
