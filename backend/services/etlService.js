const mongoose = require('mongoose');
const Employe = require('../models/Employe');
const Pointage = require('../models/Pointage');
const Salaire = require('../models/Salaire');
const Service = require('../models/Service');
const UAP = require('../models/UAP');

// Import DW Models
const DW_DimDate = require('../models/DW_DimDate');
const DW_DimEmploye = require('../models/DW_DimEmploye');
const DW_FactAttendance = require('../models/DW_FactAttendance');
const DW_FactSalary = require('../models/DW_FactSalary');

/**
 * Service pour les opérations ETL (Extract, Transform, Load)
 * Alimente l'entrepôt de données pour le décisionnel (BI)
 */

/**
 * 1. Synchronisation de la Dimension Temps (DimDate)
 * Remplit le calendrier pour l'année en cours et la suivante
 */
const syncDimDate = async (year) => {
  const currentYear = year || new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear + 1, 11, 31);
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const key = parseInt(d.toISOString().slice(0, 10).replace(/-/g, ''));
    const exists = await DW_DimDate.findOne({ date_key: key });
    
    if (!exists) {
      await DW_DimDate.create({
        date_key: key,
        full_date: new Date(d),
        day_of_week: d.getDay(),
        day_name: d.toLocaleDateString('fr-FR', { weekday: 'long' }),
        day_of_month: d.getDate(),
        month: d.getMonth() + 1,
        month_name: d.toLocaleDateString('fr-FR', { month: 'long' }),
        quarter: Math.floor(d.getMonth() / 3) + 1,
        year: d.getFullYear(),
        is_weekend: d.getDay() === 0 || d.getDay() === 6
      });
    }
  }
  console.log(`[ETL] DimDate synchronisée pour ${currentYear}`);
};

/**
 * 2. Synchronisation de la Dimension Employé (SCD Type 2)
 * Détecte les changements de Service/UAP/Salaire et crée des versions historisées
 */
const syncDimEmploye = async () => {
  const employes = await Employe.find().populate('service uap');
  
  for (const emp of employes) {
    // Vérifier s'il existe une version courante dans le DWH
    const currentDim = await DW_DimEmploye.findOne({ original_id: emp._id, is_current: true });
    
    const service_nom = emp.service?.nom_service || 'N/A';
    const uap_nom = emp.uap?.nom_uap || 'N/A';
    
    // Calcul des dimensions OLAP avec les vraies données d'employé
    const dateEmbauche = emp.date_embauche || new Date();
    const anciennete = Math.floor((new Date() - new Date(dateEmbauche)) / (1000 * 60 * 60 * 24 * 365.25));
    
    // Calculer le vrai genre depuis le modèle
    const genre = emp.sexe === 'H' ? 'Homme' : emp.sexe === 'F' ? 'Femme' : 'N/A';
    
    // Calculer la vrai tranche d'âge depuis la date de naissance
    let tranche_age = 'N/A';
    if (emp.date_naissance) {
      const today = new Date();
      const birthDate = new Date(emp.date_naissance);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 20) tranche_age = '< 20';
      else if (age < 30) tranche_age = '20-30';
      else if (age < 40) tranche_age = '30-40';
      else if (age < 50) tranche_age = '40-50';
      else tranche_age = '50+';
    }
    
    if (!currentDim) {
      // Premier chargement : Créer la version initiale
      await DW_DimEmploye.create({
        employe_key: `${emp.matricule}_v1`,
        original_id: emp._id,
        matricule: emp.matricule,
        nom: emp.nom,
        prenom: emp.prenom,
        service_nom,
        uap_nom,
        prix_heure: emp.prix_heure,
        genre,
        tranche_age,
        anciennete_annees: anciennete,
        valid_from: new Date(0), // Version initiale à partir de 1970 pour capturer l'historique
        is_current: true,
        version: 1
      });
    } else {
      // Vérifier les changements critiques (Service, UAP, Salaire)
      const hasChanged = 
        currentDim.service_nom !== service_nom || 
        currentDim.uap_nom !== uap_nom || 
        currentDim.prix_heure !== emp.prix_heure ||
        currentDim.anciennete_annees !== anciennete;
        
      if (hasChanged) {
        // 1. Fermer l'actuelle version
        currentDim.is_current = false;
        currentDim.valid_to = new Date();
        await currentDim.save();
        
        // 2. Créer la nouvelle version
        const nextVersion = currentDim.version + 1;
        await DW_DimEmploye.create({
          employe_key: `${emp.matricule}_v${nextVersion}`,
          original_id: emp._id,
          matricule: emp.matricule,
          nom: emp.nom,
          prenom: emp.prenom,
          service_nom,
          uap_nom,
          prix_heure: emp.prix_heure,
          genre,
          tranche_age,
          anciennete_annees: anciennete,
          valid_from: new Date(),
          is_current: true,
          version: nextVersion
        });
      }
    }
  }
  console.log('[ETL] DimEmploye (SCD2) synchronisée');
};

/**
 * 3. Synchronisation des Faits Pointages (FactAttendance)
 */
const syncFactAttendance = async (daysLookback = 7) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysLookback);
  
  const pointages = await Pointage.find({ date: { $gte: startDate } }).populate('employe');
  
  for (const p of pointages) {
    if (!p.employe || !p.employe._id) continue;
    const dateKey = parseInt(p.date.toISOString().slice(0, 10).replace(/-/g, ''));
    
    // Trouver la version de l'employé valide à cette date précise
    const dimEmp = await DW_DimEmploye.findOne({ 
      original_id: p.employe._id,
      valid_from: { $lte: p.date },
      $or: [{ valid_to: null }, { valid_to: { $gt: p.date } }]
    });
    
    if (!dimEmp) continue;

    // Calculer le score de productivité (mesure optionnelle)
    const productivity = p.heures_travaillees > 0 ? (p.heures_travaillees / 8) : 0;

    await DW_FactAttendance.findOneAndUpdate(
      { original_pointage_id: p._id },
      {
        date_key: dateKey,
        employe_key: dimEmp._id,
        original_pointage_id: p._id,
        service_id: p.employe.service,
        uap_id: p.employe.uap,
        worked_hours: p.heures_travaillees,
        overtime_hours: p.heures_supp,
        late_minutes: p.retard_minutes,
        is_absent: p.absence,
        productivity_score: Math.min(productivity, 1.5)
      },
      { upsert: true }
    );
  }
  console.log('[ETL] FactAttendance synchronisée (incrémental)');
};

/**
 * 4. Synchronisation des Faits Salaires (FactSalary)
 */
const syncFactSalary = async () => {
  const salaires = await Salaire.find({ statut: { $in: ['valide', 'paye'] } }).populate('employe');
  
  for (const s of salaires) {
    if (!s.employe || !s.employe._id) continue;
    const monthKey = parseInt(`${s.annee}${s.mois.toString().padStart(2, '0')}`);
    
    // On cherche l'employé en fin de mois (pour imputer au bon service de l'époque)
    const endOfMonth = new Date(s.annee, s.mois, 0);
    const dimEmp = await DW_DimEmploye.findOne({ 
      original_id: s.employe._id,
      valid_from: { $lte: endOfMonth },
      $or: [{ valid_to: null }, { valid_to: { $gt: endOfMonth } }]
    });

    if (!dimEmp) continue;

    await DW_FactSalary.findOneAndUpdate(
      { original_salaire_id: s._id },
      {
        month_year_key: monthKey,
        employe_key: dimEmp._id,
        original_salaire_id: s._id,
        service_id: s.employe.service,
        uap_id: s.employe.uap,
        base_salary: s.salaire_base,
        prime_total: s.primes_total,
        deductions_total: s.deductions + s.absences_deductions + s.retards_deductions,
        net_payable: s.salaire_net,
        is_validated: true,
        statut: s.statut
      },
      { upsert: true }
    );
  }
  console.log('[ETL] FactSalary synchronisée');
};

/**
 * Exécution complète de l'ETL
 */
const runFullETL = async () => {
  console.log('[ETL] Démarrage du flux BI...');
  const start = Date.now();
  try {
    await syncDimDate();
    await syncDimEmploye();
    await syncFactAttendance(30); // Rattrape les 30 derniers jours par sécurité
    await syncFactSalary();
    
    const duration = (Date.now() - start) / 1000;
    console.log(`[ETL] Flux BI terminé avec succès en ${duration}s`);
  } catch (err) {
    console.error('[ETL ERROR] Échec du flux décisionnel:', err);
  }
};

module.exports = {
  runFullETL,
  syncDimDate,
  syncDimEmploye,
  syncFactAttendance,
  syncFactSalary
};
