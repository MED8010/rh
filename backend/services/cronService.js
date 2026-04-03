const cron = require('node-cron');
const Conge = require('../models/Conge');
const DocumentRequest = require('../models/DocumentRequest');
const Notification = require('../models/Notification');
const Employe = require('../models/Employe');
const Pointage = require('../models/Pointage');

/**
 * Service de tâches planifiées (Cron)
 */
const initCronTasks = () => {
  // 1. Tous les matins à 08:30 : Rappel de fin de congé (3 jours avant)
  cron.schedule('30 8 * * *', async () => {
    console.log('[CRON] Vérification des fins de congés...');
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    // Début et fin de la journée dans 3 jours
    const start = new Date(threeDaysFromNow.setHours(0,0,0,0));
    const end = new Date(threeDaysFromNow.setHours(23,59,59,999));

    const congesFinishing = await Conge.find({
      date_fin: { $gte: start, $lte: end },
      statut: 'approuve'
    }).populate('employe');

    for (const conge of congesFinishing) {
      if (!conge.employe?.user) continue;
      
      const notif = new Notification({
        user: conge.employe.user,
        type: 'conge_rappel_fin',
        category: 'RH',
        titre: '📅 Reprise de travail proche',
        message: `Votre congé se termine le ${new Date(conge.date_fin).toLocaleDateString()}. Votre reprise est prévue pour le lendemain.`,
        reference_id: conge._id
      });
      await notif.save();
      // Ici on pourrait appeler la fonction push (si implémentée)
    }
  });

  // 2. Tous les matins à 09:00 : Relance documents en attente (> 3 jours)
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Vérification des documents en attente...');
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const pendingDocs = await DocumentRequest.find({
      statut: 'demande',
      date_demande: { $lte: threeDaysAgo }
    }).populate('employe');

    for (const doc of pendingDocs) {
        // Notifier les administrateurs qu'un document traîne
        // Pour cet exemple, on génère juste une notification système interne
        console.log(`[CRON] Document en retard pour ${doc.employe?.nom}`);
    }
  });

  // 3. Jours ouvrables à 10:15 : Alerte pointage manquant
  cron.schedule('15 10 * * 1-5', async () => {
    console.log('[CRON] Vérification des présences du matin...');
    const today = new Date().toISOString().split('T')[0];
    
    // On pourrait comparer la liste des employés actifs avec ceux ayant pointé aujourd'hui
    // (Simplifié pour l'exemple)
  });

  console.log('✅ Services Cron initialisés (Rappels & Automatisations)');
};

module.exports = { initCronTasks };
