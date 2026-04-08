/**
 * Script de Seeding - 10 Employés de Test avec Pointages & Salaires
 * Pour tester le système complet (OLAP, Analytics, Dashboards)
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Employe = require('./backend/models/Employe');
const Pointage = require('./backend/models/Pointage');
const Salaire = require('./backend/models/Salaire');
const Service = require('./backend/models/Service');
const UAP = require('./backend/models/UAP');

// Données test
const EMPLOYES_DATA = [
  { nom: 'Benali', prenom: 'Ahmed', sexe: 'H', prix_heure: 350 },
  { nom: 'Tahiri', prenom: 'Fatima', sexe: 'F', prix_heure: 320 },
  { nom: 'Alaoui', prenom: 'Youssef', sexe: 'H', prix_heure: 380 },
  { nom: 'Idrissi', prenom: 'Amina', sexe: 'F', prix_heure: 340 },
  { nom: 'Mansouri', prenom: 'Karim', sexe: 'H', prix_heure: 360 },
  { nom: 'El Amrani', prenom: 'Sara', sexe: 'F', prix_heure: 330 },
  { nom: 'Touzani', prenom: 'Mohamed', sexe: 'H', prix_heure: 370 },
  { nom: 'Filali', prenom: 'Meriem', sexe: 'F', prix_heure: 350 },
  { nom: 'Bennani', prenom: 'Hassan', sexe: 'H', prix_heure: 390 },
  { nom: 'Chraibi', prenom: 'Nour', sexe: 'F', prix_heure: 325 },
];

const seedTestData = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté\n');

    // 1. Récupérer la structure (services & UAPs)
    console.log('📋 Récupération de la structure...');
    const services = await Service.find().limit(4);
    const uaps = await UAP.find().limit(3);

    if (services.length === 0 || uaps.length === 0) {
      console.error('❌ Services ou UAPs non trouvés. Lancez d\'abord: node seed.js');
      await mongoose.disconnect();
      process.exit(1);
    }
    console.log(`✅ ${services.length} services, ${uaps.length} UAPs trouvés\n`);

    // 2. Créer 10 employés de test
    console.log('👥 Création de 10 employés de test...');
    const employes = [];
    const today = new Date();
    const timestamp = Date.now().toString().slice(-6); // Dernier 6 chiffres du timestamp

    for (let i = 0; i < EMPLOYES_DATA.length; i++) {
      const data = EMPLOYES_DATA[i];
      const matricule = `TST${timestamp}${String(i + 1).padStart(2, '0')}`;
      
      // Générer date_naissance : 25-55 ans
      const ageAtHire = 25 + Math.floor(Math.random() * 30);
      const birthDate = new Date(today.getFullYear() - ageAtHire, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      
      // Date d'embauche : 1-5 ans
      const yearsAgo = 1 + Math.floor(Math.random() * 4);
      const hireDate = new Date(today.getFullYear() - yearsAgo, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

      const emp = await Employe.create({
        matricule,
        nom: data.nom,
        prenom: data.prenom,
        date_naissance: birthDate,
        sexe: data.sexe,
        date_embauche: hireDate,
        prix_heure: data.prix_heure,
        service: services[i % services.length]._id,
        uap: uaps[i % uaps.length]._id,
        email: `${data.prenom.toLowerCase()}.${data.nom.toLowerCase()}@test.rh.app`,
        telephone: `06${Math.floor(Math.random() * 900000000 + 10000000)}`,
        adresse: '123 Rue Test, Tunis',
        solde_conge_total: 22,
        solde_conge_restant: 22,
        statut: 'actif'
      });

      employes.push(emp);
      console.log(`  ✅ ${matricule} - ${data.prenom} ${data.nom} (${data.sexe})`);
    }
    console.log();

    // 3. Générer pointages pour chaque employé (30 jours)
    console.log('⏱️  Génération de 30 jours de pointages par employé...');
    let pointageCount = 0;

    for (const emp of employes) {
      for (let day = 29; day >= 0; day--) {
        const currentDate = new Date(today);
        currentDate.setDate(currentDate.getDate() - day);
        
        // Skip weekends
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;

        const rand = Math.random();

        if (rand < 0.05) {
          // 5% absence
          await Pointage.create({
            employe: emp._id,
            date: currentDate,
            absence: true,
            motif_absence: Math.random() > 0.5 ? 'Maladie' : 'Congé non payé',
            heure_entree: '00:00',
            heure_sortie: '00:00',
            heures_travaillees: 0,
            heures_supp: 0,
            source: 'manual'
          });
          pointageCount++;
        } else if (rand < 0.12) {
          // 7% retard
          const minutesRetard = 10 + Math.floor(Math.random() * 35);
          const heuresTravaillees = 8 - (minutesRetard / 60);
          const [heure, minute] = ['09', Math.floor(8 * 60 + minutesRetard / 60)].map(String);
          
          await Pointage.create({
            employe: emp._id,
            date: currentDate,
            absence: false,
            motif_absence: '',
            heure_entree: `09:${String(minutesRetard).padStart(2, '0')}`,
            heure_sortie: '17:30',
            heures_travaillees: parseFloat(heuresTravaillees.toFixed(2)),
            heures_supp: 0,
            retard_minutes: minutesRetard,
            source: 'biometric'
          });
          pointageCount++;
        } else {
          // Journée normale ou avec heures supp
          const heuresSupp = Math.random() > 0.75 ? (0.5 + Math.floor(Math.random() * 3)) : 0;
          const heuresTravaillees = 8 + heuresSupp;

          await Pointage.create({
            employe: emp._id,
            date: currentDate,
            absence: false,
            motif_absence: '',
            heure_entree: '08:00',
            heure_sortie: heuresSupp > 0 ? `${17 + Math.floor(heuresSupp)}:30` : '17:30',
            heures_travaillees: heuresTravaillees,
            heures_supp: heuresSupp,
            source: 'biometric'
          });
          pointageCount++;
        }
      }
    }
    console.log(`✅ ${pointageCount} pointages créés\n`);

    // 4. Calculer et créer les salaires
    console.log('💰 Génération des salaires du mois...');
    let salaireCount = 0;
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    for (const emp of employes) {
      // Aggreger les pointages du mois
      const pointages = await Pointage.find({
        employe: emp._id,
        date: {
          $gte: new Date(currentYear, currentMonth, 1),
          $lte: new Date(currentYear, currentMonth + 1, 0)
        }
      });

      let totalHeures = 0;
      let totalHeuresSupp = 0;
      let absences = 0;
      let totalRetardMinutes = 0;

      pointages.forEach(p => {
        if (p.absence) {
          absences++;
        } else {
          totalHeures += p.heures_travaillees || 0;
          totalHeuresSupp += p.heures_supp || 0;
          totalRetardMinutes += p.retard_minutes || 0;
        }
      });

      // Calcul salaire
      const salaireBase = (totalHeures - totalHeuresSupp) * emp.prix_heure;
      const primeHeuresSupp = totalHeuresSupp * emp.prix_heure * 1.5;
      const deductionAbsences = absences * 8 * emp.prix_heure;
      const deductionRetards = (totalRetardMinutes / 60) * (emp.prix_heure * 0.1);
      const primes = Math.floor(Math.random() * 5) * 100; // 0-400 DT
      const netPayable = salaireBase + primeHeuresSupp + primes - deductionAbsences - deductionRetards;

      await Salaire.create({
        employe: emp._id,
        mois: currentMonth + 1,
        annee: currentYear,
        prix_heure: emp.prix_heure,
        heures_normales: totalHeures - totalHeuresSupp,
        heures_supp: parseFloat(totalHeuresSupp.toFixed(2)),
        salaire_base: parseFloat(salaireBase.toFixed(2)),
        primes_total: primes,
        absences_deductions: parseFloat(deductionAbsences.toFixed(2)),
        retards_deductions: parseFloat(deductionRetards.toFixed(2)),
        deductions: parseFloat((deductionAbsences + deductionRetards).toFixed(2)),
        salaire_brut: parseFloat((salaireBase + primeHeuresSupp).toFixed(2)),
        salaire_net: parseFloat(netPayable.toFixed(2)),
        statut: 'calcule'
      });

      salaireCount++;
    }
    console.log(`✅ ${salaireCount} salaires créés\n`);

    // 5. Résumé
    console.log('=====================================');
    console.log('✅ SEED TEST DATA COMPLÉTÉ!');
    console.log('=====================================\n');
    console.log('📊 Résumé:');
    console.log(`  • 10 employés de test créés`);
    console.log(`  • Services: ${employes.map(e => e.service).filter((v, i, a) => a.indexOf(v) === i).length}`);
    console.log(`  • Pointages: ${pointageCount} enregistrements`);
    console.log(`  • Salaires: ${salaireCount} fiches de paie`);
    console.log('\n📋 Employés créés:');
    employes.forEach((emp, i) => {
      console.log(`  ${(i+1).toString().padStart(2, ' ')}. ${emp.matricule} - ${emp.prenom} ${emp.nom} (${emp.sexe}) - ${emp.prix_heure}DT/h`);
    });

    console.log('\n✅ Vous pouvez maintenant tester:');
    console.log('  • Dashboard Admin (KPIs, Top 10, Analytics)');
    console.log('  • OLAP Cube (Genre, Tranche d\'Âge, Ancienneté, etc.)');
    console.log('  • Analyse des Pointages');
    console.log('  • Calculs de Salaires');
    console.log('  • Rapports BI\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedTestData();
