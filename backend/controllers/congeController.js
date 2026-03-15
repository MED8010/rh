const Conge = require('../models/Conge');
const Employe = require('../models/Employe');

// Demander un congé
const requestConge = async (req, res) => {
  try {
    const { employe_id, date_debut, date_fin, type, motif } = req.body;

    console.log('📝 Création demande congé:', { employe_id, date_debut, date_fin, type, motif });

    // Validation
    if (!employe_id || !date_debut || !date_fin || !type) {
      console.log('❌ Champs manquants');
      return res.status(400).json({ message: 'Champs manquants: employe_id, date_debut, date_fin, type sont obligatoires' });
    }

    // Calculer le nombre de jours
    const start = new Date(date_debut);
    const end = new Date(date_fin);
    const diffTime = Math.abs(end - start);
    const nombre_jours = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    console.log('📅 Nombre de jours calculé:', nombre_jours);

    const employe = await Employe.findById(employe_id);
    if (!employe) {
      console.log('❌ Employé non trouvé:', employe_id);
      return res.status(404).json({ message: 'Employé non trouvé' });
    }

    console.log('✅ Employé trouvé:', employe.prenom, employe.nom);
    console.log('📊 Solde congé restant:', employe.solde_conge_restant);

    if (type === 'annuel' && employe.solde_conge_restant < nombre_jours) {
      console.log('❌ Solde insuffisant');
      return res.status(400).json({ message: `Solde insuffisant! Vous avez ${employe.solde_conge_restant} jours disponibles` });
    }

    const conge = new Conge({
      employe: employe_id,
      date_debut,
      date_fin,
      nombre_jours,
      type,
      motif,
      statut: 'demande'
    });

    console.log('💾 Sauvegarde congé en cours...');
    await conge.save();
    console.log('✅ Congé créé avec succès:', conge._id);

    await conge.populate('employe');

    res.status(201).json({ message: 'Demande de congé créée avec succès', conge });
  } catch (error) {
    console.error('❌ Erreur création congé:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la demande', error: error.message });
  }
};

// Obtenir les demandes de congés
const getConges = async (req, res) => {
  try {
    const { employe_id, statut } = req.query;
    let filter = {};

    if (employe_id) filter.employe = employe_id;
    if (statut) filter.statut = statut;

    const conges = await Conge.find(filter).populate(['employe', 'valide_par']).sort({ createdAt: -1 });
    res.json(conges);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des congés', error: error.message });
  }
};

// Approuver un congé
const approveConge = async (req, res) => {
  try {
    const { id } = req.params;
    const conge = await Conge.findById(id);

    if (!conge) {
      return res.status(404).json({ message: 'Congé non trouvé' });
    }

    const employe = await Employe.findById(conge.employe);

    // Déduire le solde de congé
    if (conge.type === 'annuel') {
      employe.solde_conge_restant -= conge.nombre_jours;
      if (employe.solde_conge_restant < 0) {
        return res.status(400).json({ message: 'Solde de congé insuffisant' });
      }
    }

    conge.statut = 'approuve';
    conge.valide_par = req.user.id;
    conge.date_validation = new Date();

    await conge.save();
    await employe.save();

    res.json({ message: 'Congé approuvé avec succès', conge });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'approbation du congé', error: error.message });
  }
};

// Refuser un congé
const rejectConge = async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire_rejet } = req.body;

    const conge = await Conge.findByIdAndUpdate(
      id,
      {
        statut: 'refuse',
        commentaire_rejet,
        valide_par: req.user.id,
        date_validation: new Date()
      },
      { new: true }
    ).populate(['employe', 'valide_par']);

    res.json({ message: 'Congé refusé', conge });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du refus du congé', error: error.message });
  }
};

// Obtenir le solde de congé d'un employé
const getCongeBalance = async (req, res) => {
  try {
    const { employe_id } = req.params;
    const employe = await Employe.findById(employe_id);

    if (!employe) {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }

    res.json({
      solde_total: employe.solde_conge_total,
      solde_restant: employe.solde_conge_restant,
      utilise: employe.solde_conge_total - employe.solde_conge_restant
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du solde', error: error.message });
  }
};

module.exports = { requestConge, getConges, approveConge, rejectConge, getCongeBalance };
