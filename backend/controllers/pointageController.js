const Pointage = require('../models/Pointage');
const Employe = require('../models/Employe');
const Conge = require('../models/Conge');

// Créer ou mettre à jour un pointage
const createPointage = async (req, res) => {
  try {
    const { employe_id, date, heure_entree, heure_sortie, absence, motif_absence } = req.body;

    let pointage = await Pointage.findOne({
      employe: employe_id,
      date: new Date(date)
    });

    if (!pointage) {
      pointage = new Pointage({
        employe: employe_id,
        date: new Date(date),
        heure_entree,
        heure_sortie,
        absence,
        motif_absence
      });
    } else {
      pointage.heure_sortie = heure_sortie || pointage.heure_sortie;
      pointage.absence = absence !== undefined ? absence : pointage.absence;
      pointage.motif_absence = motif_absence || pointage.motif_absence;
    }

    // Calculer les retards et heures travaillées
    if (pointage.heure_entree && !pointage.absence) {
      const entryTime = new Date(`2000-01-01 ${pointage.heure_entree}`);
      const expectedTime = new Date(`2000-01-01 08:00:00`);
      const diffMinutes = Math.max(0, (entryTime - expectedTime) / (1000 * 60));
      pointage.retard_minutes = Math.round(diffMinutes);

      if (pointage.heure_sortie) {
        const exitTime = new Date(`2000-01-01 ${pointage.heure_sortie}`);
        const workedMinutes = (exitTime - entryTime) / (1000 * 60);
        pointage.heures_travaillees = parseFloat((workedMinutes / 60).toFixed(2));

        // Calculer les heures supplémentaires (au-delà de 8h)
        if (pointage.heures_travaillees > 8) {
          pointage.heures_supp = parseFloat((pointage.heures_travaillees - 8).toFixed(2));
          pointage.heures_travaillees = 8;
        }
      }
    }

    await pointage.save();
    await pointage.populate('employe');

    res.status(201).json({ message: 'Pointage enregistré avec succès', pointage });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement du pointage', error: error.message });
  }
};

// Obtenir les pointages d'un employé
const getPointagesByEmploye = async (req, res) => {
  try {
    const { employe_id } = req.params;
    const { startDate, endDate } = req.query;

    let filter = { employe: employe_id };
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const pointages = await Pointage.find(filter).populate('employe').sort({ date: -1 });
    res.json(pointages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des pointages', error: error.message });
  }
};

// Obtenir les retards du jour
const getRetardsOfDay = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const retards = await Pointage.find({
      date: { $gte: today },
      retard_minutes: { $gt: 0 }
    }).populate('employe');

    res.json(retards);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des retards', error: error.message });
  }
};

// Obtenir les absences du jour
const getAbsencesOfDay = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const absences = await Pointage.find({
      date: { $gte: today },
      absence: true
    }).populate('employe');

    res.json(absences);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des absences', error: error.message });
  }
};

// Obtenir les statistiques du temps avec filtres
const getTimeStats = async (req, res) => {
  try {
    const { service, uap, mois, annee } = req.query;

    let dateFilter = {};
    if (mois && annee) {
      const startDate = new Date(annee, mois - 1, 1);
      const endDate = new Date(annee, mois, 0, 23, 59, 59, 999);
      dateFilter.date = { $gte: startDate, $lte: endDate };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter.date = { $gte: today };
    }

    // Filtre sur l'employé pour le pointage
    let pointageMatch = { ...dateFilter };

    // Pour filtrer les pointages par service/uap de l'employé, on doit d'abord identifier les IDs des employés concernés
    let employeFilter = { statut: 'actif' };
    if (service) employeFilter.service = service;
    if (uap) employeFilter.uap = uap;

    const filteredEmployes = await Employe.find(employeFilter).select('_id');
    const employeIds = filteredEmployes.map(e => e._id);

    pointageMatch.employe = { $in: employeIds };

    const retardCount = await Pointage.countDocuments({
      ...pointageMatch,
      retard_minutes: { $gt: 0 }
    });

    const absenceCount = await Pointage.countDocuments({
      ...pointageMatch,
      absence: true
    });

    const totalFilteredEmployes = employeIds.length;

    // Distribution géographique (Villes)
    const allEmployes = await Employe.find(employeFilter).select('adresse');
    console.log('📍 DEBUG: employeFilter:', employeFilter);
    console.log('📍 DEBUG: total employes found for geo:', allEmployes.length);

    const villesDist = allEmployes.reduce((acc, emp) => {
      if (emp.adresse) {
        const parts = emp.adresse.split(',');
        const ville = parts.length > 2 ? parts[parts.length - 2].trim() : 'Inconnue';
        acc[ville] = (acc[ville] || 0) + 1;
      }
      return acc;
    }, {});

    console.log('📍 DEBUG: villesDist:', villesDist);

    const distributionGeographique = Object.entries(villesDist).map(([ville, count]) => ({
      ville,
      count
    })).sort((a, b) => b.count - a.count);

    res.json({
      retardCount,
      absenceCount,
      presentCount: totalFilteredEmployes - absenceCount - retardCount,
      totalEmployes: totalFilteredEmployes,
      tauxRetard: totalFilteredEmployes > 0 ? ((retardCount / totalFilteredEmployes) * 100).toFixed(2) : 0,
      tauxAbsenteisme: totalFilteredEmployes > 0 ? ((absenceCount / totalFilteredEmployes) * 100).toFixed(2) : 0,
      distributionGeographique
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques', error: error.message });
  }
};

// Obtenir les statistiques temps & discipline avec plage de dates
const getTimeDisciplineStats = async (req, res) => {
  try {
    const { date_debut, date_fin, service, uap } = req.query;

    let dateFilter = {};
    if (date_debut && date_fin) {
      const startDate = new Date(date_debut);
      const endDate = new Date(date_fin);
      endDate.setHours(23, 59, 59, 999);
      dateFilter = {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }

    // Récupérer les pointages avec employe pour accès aux services/UAPs
    const allPointages = await Pointage.find(dateFilter)
      .populate({
        path: 'employe',
        select: 'nom prenom service uap',
        populate: [
          { path: 'service', select: 'nom_service' },
          { path: 'uap', select: 'nom_uap' }
        ]
      });

    // Appliquer les filtres service/uap
    const pointages = allPointages.filter(p => {
      if (!p.employe) return false;
      let match = true;
      if (service && p.employe.service?._id.toString() !== service) match = false;
      if (uap && p.employe.uap?._id.toString() !== uap) match = false;
      return match;
    });

    // Compter les absences
    const absencesAll = pointages.filter(p => p.absence);
    const absencesJustifiees = absencesAll.filter(p => p.motif_absence && p.motif_absence.trim() !== '');
    const absencesNonJustifiees = absencesAll.length - absencesJustifiees.length;

    // Compter les retards
    const retardsAll = pointages.filter(p => p.retard_minutes > 0 && !p.absence);

    // Compter les employés uniques pour le taux
    const employesUniques = new Set(pointages.map(p => p.employe._id.toString()));
    const totalEmployes = employesUniques.size;

    // Congés pris (approuvés dans la même période)
    const congesPris = await Conge.countDocuments({
      statut: 'approuve',
      date_debut: { $lte: new Date(date_fin) },
      date_fin: { $gte: new Date(date_debut) }
    });

    // Congés restants (total - pris pour cet année)
    const currentYear = new Date().getFullYear();
    const congesRestants = totalEmployes > 0 ? totalEmployes * 22 - congesPris : 0;

    // Aggégation par service
    const retardsByService = {};
    const absencesByService = {};

    pointages.forEach(p => {
      const serviceName = p.employe?.service?.nom_service || 'Non assigné';

      if (!retardsByService[serviceName]) {
        retardsByService[serviceName] = { count: 0, employes: new Set() };
      }
      if (!absencesByService[serviceName]) {
        absencesByService[serviceName] = { count: 0, employes: new Set() };
      }

      if (p.retard_minutes > 0 && !p.absence) {
        retardsByService[serviceName].count++;
        retardsByService[serviceName].employes.add(p.employe._id.toString());
      }
      if (p.absence) {
        absencesByService[serviceName].count++;
        absencesByService[serviceName].employes.add(p.employe._id.toString());
      }
    });

    // Agrégation par UAP
    const retardsByUAP = {};
    const absencesByUAP = {};

    pointages.forEach(p => {
      const uapName = p.employe?.uap?.nom_uap || 'Non assigné';

      if (!retardsByUAP[uapName]) {
        retardsByUAP[uapName] = { count: 0, employes: new Set() };
      }
      if (!absencesByUAP[uapName]) {
        absencesByUAP[uapName] = { count: 0, employes: new Set() };
      }

      if (p.retard_minutes > 0 && !p.absence) {
        retardsByUAP[uapName].count++;
        retardsByUAP[uapName].employes.add(p.employe._id.toString());
      }
      if (p.absence) {
        absencesByUAP[uapName].count++;
        absencesByUAP[uapName].employes.add(p.employe._id.toString());
      }
    });

    // Convertir en arrays avec calculs de taux
    const retardsByServiceArray = Object.entries(retardsByService).map(([name, data]) => ({
      nomService: name,
      totalRetards: data.count,
      employesRetards: data.employes.size,
      tauxRetard: totalEmployes > 0 ? ((data.employes.size / totalEmployes) * 100).toFixed(2) : 0
    }));

    const retardsByUAPArray = Object.entries(retardsByUAP).map(([name, data]) => ({
      nomUAP: name,
      totalRetards: data.count,
      employesRetards: data.employes.size,
      tauxRetard: totalEmployes > 0 ? ((data.employes.size / totalEmployes) * 100).toFixed(2) : 0
    }));

    const absencesByServiceArray = Object.entries(absencesByService).map(([name, data]) => ({
      nomService: name,
      totalAbsences: data.count,
      employesAbsents: data.employes.size,
      tauxAbsenteisme: totalEmployes > 0 ? ((data.employes.size / totalEmployes) * 100).toFixed(2) : 0
    }));

    const absencesByUAPArray = Object.entries(absencesByUAP).map(([name, data]) => ({
      nomUAP: name,
      totalAbsences: data.count,
      employesAbsents: data.employes.size,
      tauxAbsenteisme: totalEmployes > 0 ? ((data.employes.size / totalEmployes) * 100).toFixed(2) : 0
    }));

    res.json({
      periode: {
        debut: date_debut || 'N/A',
        fin: date_fin || 'N/A'
      },
      totalEmployes,
      retards: {
        total: retardsAll.length,
        employes: new Set(retardsAll.map(p => p.employe._id.toString())).size,
        taux: totalEmployes > 0 ? ((retardsAll.length / (totalEmployes * (new Date(date_fin).getTime() - new Date(date_debut).getTime()) / (1000 * 60 * 60 * 24))) * 100).toFixed(2) : 0
      },
      absences: {
        justifiees: absencesJustifiees.length,
        nonJustifiees: absencesNonJustifiees,
        total: absencesAll.length,
        employes: new Set(absencesAll.map(p => p.employe._id.toString())).size,
        taux: totalEmployes > 0 ? ((absencesAll.length / (totalEmployes * (new Date(date_fin).getTime() - new Date(date_debut).getTime()) / (1000 * 60 * 60 * 24))) * 100).toFixed(2) : 0
      },
      conges: {
        pris: congesPris,
        restants: congesRestants
      },
      retardsByService: retardsByServiceArray,
      retardsByUAP: retardsByUAPArray,
      absencesByService: absencesByServiceArray,
      absencesByUAP: absencesByUAPArray
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du calcul des statistiques', error: error.message });
  }
};

module.exports = { createPointage, getPointagesByEmploye, getRetardsOfDay, getAbsencesOfDay, getTimeStats, getTimeDisciplineStats };
