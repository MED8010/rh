const Salaire = require('../models/Salaire');
const Employe = require('../models/Employe');
const Pointage = require('../models/Pointage');
const Prime = require('../models/Prime');
const Discipline = require('../models/Discipline');

// Calculer le salaire d'un employé pour un mois
const calculateSalaire = async (req, res) => {
  try {
    const { employe_id, mois, annee } = req.body;

    const employe = await Employe.findById(employe_id);
    if (!employe) {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }

    // Vérifier s'il existe déjà un salaire
    let salaire = await Salaire.findOne({ employe: employe_id, mois, annee });
    if (!salaire) {
      salaire = new Salaire({
        employe: employe_id,
        mois,
        annee,
        prix_heure: employe.prix_heure
      });
    }

    // Obtenir les pointages du mois
    const startDate = new Date(annee, mois - 1, 1);
    const endDate = new Date(annee, mois, 0);

    const pointages = await Pointage.find({
      employe: employe_id,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculer les heures
    let heures_normales = 0;
    let heures_supp = 0;
    let retard_minutes = 0;
    let absences = 0;

    pointages.forEach(p => {
      heures_normales += p.heures_travaillees || 0;
      heures_supp += p.heures_supp || 0;
      retard_minutes += p.retard_minutes || 0;
      if (p.absence) absences += 1;
    });

    // Obtenir les primes du mois
    const primes = await Prime.find({
      employe: employe_id,
      mois,
      annee
    });

    let primes_total = 0;
    primes.forEach(p => {
      primes_total += p.montant;
    });

    // Obtenir les disciplines du mois
    const disciplines = await Discipline.find({
      employe: employe_id,
      date: { $gte: startDate, $lte: endDate }
    });

    let deductions_discipline = 0;
    disciplines.forEach(d => {
      deductions_discipline += d.montant_sanction || 0;
    });

    // Calculer les déductions
    // Déduction pour absences (1 jour = 8 heures)
    const absence_deductions = absences * 8 * employe.prix_heure;

    // Déduction pour retards (10% du salaire horaire par heure de retard)
    const retard_deductions = (retard_minutes / 60) * (employe.prix_heure * 0.1);

    // Calculer le salaire
    const salaire_base = heures_normales * employe.prix_heure;
    const heures_supp_amount = heures_supp * employe.prix_heure * 1.5; // 150% du salaire horaire
    const total_deductions = absence_deductions + retard_deductions + deductions_discipline;
    const salaire_brut = salaire_base + heures_supp_amount + primes_total;
    const salaire_net = salaire_brut - total_deductions;

    salaire.heures_normales = heures_normales;
    salaire.heures_supp = heures_supp;
    salaire.primes_total = primes_total;
    salaire.salaire_base = salaire_base;
    salaire.absences_deductions = absence_deductions;
    salaire.retards_deductions = retard_deductions;
    salaire.deductions = total_deductions;
    salaire.salaire_brut = parseFloat(salaire_brut.toFixed(2));
    salaire.salaire_net = parseFloat(salaire_net.toFixed(2));
    salaire.statut = 'calcule';

    await salaire.save();
    await salaire.populate('employe');

    res.json({ message: 'Salaire calculé avec succès', salaire });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du calcul du salaire', error: error.message });
  }
};

// Obtenir les salaires
const getSalaires = async (req, res) => {
  try {
    const { employe_id, mois, annee, statut } = req.query;
    let filter = {};

    if (employe_id) filter.employe = employe_id;
    if (mois) filter.mois = parseInt(mois);
    if (annee) filter.annee = parseInt(annee);
    if (statut) filter.statut = statut;

    const salaires = await Salaire.find(filter).populate('employe').sort({ annee: -1, mois: -1 });
    res.json(salaires);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des salaires', error: error.message });
  }
};

// Valider un salaire
const validateSalaire = async (req, res) => {
  try {
    const { id } = req.params;
    const salaire = await Salaire.findByIdAndUpdate(
      id,
      {
        statut: 'valide',
        validee: true,
        valide_par: req.user.id,
        date_validation: new Date()
      },
      { new: true }
    ).populate('employe');

    res.json({ message: 'Salaire validé avec succès', salaire });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la validation du salaire', error: error.message });
  }
};

// Obtenir les statistiques salariales
const getSalaireStats = async (req, res) => {
  try {
    const { mois, annee, service, uap } = req.query;
    let filter = {};

    if (mois) filter.mois = parseInt(mois);
    if (annee) filter.annee = parseInt(annee);

    // Filtre sur l'employé
    let employeMatch = {};
    if (service) employeMatch.service = service;
    if (uap) employeMatch.uap = uap;

    const salaires = await Salaire.find(filter).populate({
      path: 'employe',
      match: employeMatch
    });

    // On ne garde que les salaires dont l'employé correspond aux critères (si filtrés)
    const filteredSalaires = salaires.filter(s => s.employe !== null);

    let masse_salariale = 0;
    let heures_totales = 0;

    filteredSalaires.forEach(s => {
      masse_salariale += s.salaire_net || 0;
      heures_totales += s.heures_normales || 0;
    });

    const salaire_moyen = filteredSalaires.length > 0 ? (masse_salariale / filteredSalaires.length).toFixed(2) : 0;

    res.json({
      nombre_salaires: filteredSalaires.length,
      masse_salariale: parseFloat(masse_salariale.toFixed(2)),
      salaire_moyen: parseFloat(salaire_moyen),
      heures_totales: parseFloat(heures_totales.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques', error: error.message });
  }
};

// Obtenir les statistiques analytiques de salaires avec services et UAPs
const getSalaryAnalytics = async (req, res) => {
  try {
    const { mois, annee, service, uap } = req.query;
    let filter = {};

    if (mois) filter.mois = parseInt(mois);
    if (annee) filter.annee = parseInt(annee);

    // Récupérer les salaires avec données employé complètes
    const salaires = await Salaire.find(filter).populate({
      path: 'employe',
      select: 'nom prenom service uap',
      populate: [
        { path: 'service', select: 'nom_service' },
        { path: 'uap', select: 'nom_uap' }
      ]
    });

    // Appliquer les filtres service/uap sur les salaires récupérés
    let filteredSalaires = salaires.filter(s => {
      if (!s.employe) return false;
      let match = true;
      if (service && s.employe.service?._id.toString() !== service) match = false;
      if (uap && s.employe.uap?._id.toString() !== uap) match = false;
      return match;
    });

    // Utiliser filteredSalaires pour la suite des calculs
    const processSalaires = filteredSalaires;

    // Initialiser les structures pour aggrégation
    const salaireMoyenParService = {};
    const salaireMoyenParUAP = {};
    const masseSalarialeParService = {};
    const masseSalarialeParUAP = {};
    let totalPrimes = 0;
    let totalHeuresSup = 0;
    let totalCoutHeuresSup = 0;

    // Traiter chaque salaire
    processSalaires.forEach(s => {
      const serviceName = s.employe?.service?.nom_service || 'Non assigné';
      const uapName = s.employe?.uap?.nom_uap || 'Non assigné';
      const salaire_net = s.salaire_net || 0;
      const primes = s.primes_total || 0;
      const heures_supp = s.heures_supp || 0;

      // Accumulation des primes et heures supp
      totalPrimes += primes;
      totalHeuresSup += heures_supp;
      totalCoutHeuresSup += heures_supp * (s.prix_heure || 0) * 1.5;

      // Par Service
      if (!salaireMoyenParService[serviceName]) {
        salaireMoyenParService[serviceName] = { total: 0, count: 0 };
      }
      salaireMoyenParService[serviceName].total += salaire_net;
      salaireMoyenParService[serviceName].count++;

      if (!masseSalarialeParService[serviceName]) {
        masseSalarialeParService[serviceName] = 0;
      }
      masseSalarialeParService[serviceName] += salaire_net;

      // Par UAP
      if (!salaireMoyenParUAP[uapName]) {
        salaireMoyenParUAP[uapName] = { total: 0, count: 0 };
      }
      salaireMoyenParUAP[uapName].total += salaire_net;
      salaireMoyenParUAP[uapName].count++;

      if (!masseSalarialeParUAP[uapName]) {
        masseSalarialeParUAP[uapName] = 0;
      }
      masseSalarialeParUAP[uapName] += salaire_net;
    });

    // Convertir les structures en arrays avec calculs
    const salaireMoyenParServiceArray = Object.entries(salaireMoyenParService).map(([name, data]) => ({
      nomService: name,
      salaireMoyen: parseFloat((data.total / data.count).toFixed(2)),
      count: data.count
    }));

    const salaireMoyenParUAPArray = Object.entries(salaireMoyenParUAP).map(([name, data]) => ({
      nomUAP: name,
      salaireMoyen: parseFloat((data.total / data.count).toFixed(2)),
      count: data.count
    }));

    const masseSalarialeParServiceArray = Object.entries(masseSalarialeParService).map(([name, total]) => ({
      nomService: name,
      masseSalariale: parseFloat(total.toFixed(2))
    }));

    const masseSalarialeParUAPArray = Object.entries(masseSalarialeParUAP).map(([name, total]) => ({
      nomUAP: name,
      masseSalariale: parseFloat(total.toFixed(2))
    }));

    // Salaire global moyen
    const salaireMoyenGlobal = processSalaires.length > 0
      ? parseFloat((masseSalarialeParServiceArray.reduce((acc, s) => acc + s.masseSalariale, 0) / processSalaires.length).toFixed(2))
      : 0;

    // Masse salariale globale
    const masseSalarialeGlobale = processSalaires.length > 0
      ? parseFloat(masseSalarialeParServiceArray.reduce((acc, s) => acc + s.masseSalariale, 0).toFixed(2))
      : 0;

    // Prime moyenne
    const primeMoyenne = processSalaires.length > 0
      ? parseFloat((totalPrimes / processSalaires.length).toFixed(2))
      : 0;

    res.json({
      periode: {
        mois: mois || 'tous',
        annee: annee || 'tous'
      },
      salaireMoyen: salaireMoyenGlobal,
      salaireMoyenParService: salaireMoyenParServiceArray,
      salaireMoyenParUAP: salaireMoyenParUAPArray,
      masseSalariale: masseSalarialeGlobale,
      masseSalarialeParService: masseSalarialeParServiceArray,
      masseSalarialeParUAP: masseSalarialeParUAPArray,
      primes: {
        total: parseFloat(totalPrimes.toFixed(2)),
        moyenne: primeMoyenne
      },
      heuresSup: {
        total: parseFloat(totalHeuresSup.toFixed(2)),
        cout: parseFloat(totalCoutHeuresSup.toFixed(2))
      },
      nombreEmployes: processSalaires.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du calcul des statistiques salariales', error: error.message });
  }
};

// Valider tous les salaires calculés pour un mois spécifique
const validateAllSalaires = async (req, res) => {
  try {
    const { mois, annee } = req.body;

    const result = await Salaire.updateMany(
      { mois, annee, statut: 'calcule' },
      {
        statut: 'paye',
        validee: true,
        valide_par: req.user.id,
        date_validation: new Date()
      }
    );

    res.json({
      message: `${result.modifiedCount} salaire(s) validé(s) avec succès`,
      count: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la validation groupée', error: error.message });
  }
};

// Obtenir les tendances mensuelles (6 derniers mois)
const getMonthlyTrends = async (req, res) => {
  try {
    const today = new Date();
    const trends = [];

    // On remonte 6 mois en arrière
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mois = d.getMonth() + 1;
      const annee = d.getFullYear();

      const stats = await Salaire.aggregate([
        { $match: { mois, annee, statut: 'paye' } },
        {
          $group: {
            _id: null,
            masseSalariale: { $sum: '$salaire_net' },
            heuresSup: { $sum: '$heures_supp' },
            count: { $sum: 1 }
          }
        }
      ]);

      trends.push({
        mois,
        annee,
        label: `${mois}/${annee}`,
        masseSalariale: stats[0]?.masseSalariale || 0,
        heuresSup: stats[0]?.heuresSup || 0,
        employes: stats[0]?.count || 0
      });
    }

    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des tendances', error: error.message });
  }
};

module.exports = {
  calculateSalaire,
  getSalaires,
  validateSalaire,
  validateAllSalaires,
  getSalaireStats,
  getSalaryAnalytics,
  getMonthlyTrends
};
