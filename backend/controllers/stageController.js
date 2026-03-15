const StageRequest = require('../models/StageRequest');
const Employe = require('../models/Employe');
const Notification = require('../models/Notification');

// Créer une demande de stage
const createStageRequest = async (req, res) => {
  try {
    const { titre, description, domaine, date_debut, date_fin, entreprise } = req.body;
    const employe_id = req.user.id; // ID du user, récupérer l'employe

    const employe = await Employe.findOne({ user: employe_id });
    if (!employe) {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }

    const stageRequest = new StageRequest({
      employe: employe._id,
      titre,
      description,
      domaine,
      date_debut: new Date(date_debut),
      date_fin: new Date(date_fin),
      entreprise
    });

    await stageRequest.save();

    // Créer une notification pour les admins
    // TODO: Envoyer notification aux admins/chefs de service

    res.status(201).json({ message: 'Demande de stage créée', stageRequest });
  } catch (error) {
    console.error('Erreur création stage:', error);
    res.status(500).json({ message: 'Erreur lors de la création', error: error.message });
  }
};

// Obtenir les demandes de stage de l'employé
const getMyStageRequests = async (req, res) => {
  try {
    const employe = await Employe.findOne({ user: req.user.id });
    if (!employe) {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }

    const stages = await StageRequest.find({ employe: employe._id })
      .populate('approuve_par', 'email')
      .sort({ createdAt: -1 });

    res.json(stages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération', error: error.message });
  }
};

// Obtenir toutes les demandes de stage (pour les admins/chefs)
const getAllStageRequests = async (req, res) => {
  try {
    const stages = await StageRequest.find()
      .populate('employe', 'nom prenom email')
      .populate('approuve_par', 'email')
      .sort({ createdAt: -1 });

    res.json(stages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération', error: error.message });
  }
};

// Approuver une demande de stage
const approveStagRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const stage = await StageRequest.findByIdAndUpdate(
      id,
      {
        statut: 'approuve',
        approuve_par: req.user.id,
        date_approuve: new Date()
      },
      { new: true }
    ).populate('employe');

    if (!stage) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    // Créer une notification pour l'employé
    const notification = new Notification({
      user: stage.employe.user,
      type: 'stage_approuve',
      titre: 'Demande de stage approuvée',
      message: `Votre demande de stage "${stage.titre}" a été approuvée`,
      reference_id: stage._id
    });
    await notification.save();

    res.json({ message: 'Demande approuvée', stage });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'approbation', error: error.message });
  }
};

// Refuser une demande de stage
const rejectStageRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { motif_refus } = req.body;

    const stage = await StageRequest.findByIdAndUpdate(
      id,
      {
        statut: 'refuse',
        approuve_par: req.user.id,
        motif_refus,
        date_approuve: new Date()
      },
      { new: true }
    ).populate('employe');

    if (!stage) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    // Créer une notification pour l'employé
    const notification = new Notification({
      user: stage.employe.user,
      type: 'stage_refuse',
      titre: 'Demande de stage refusée',
      message: `Votre demande de stage "${stage.titre}" a été refusée. Motif: ${motif_refus}`,
      reference_id: stage._id
    });
    await notification.save();

    res.json({ message: 'Demande refusée', stage });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du refus', error: error.message });
  }
};

module.exports = {
  createStageRequest,
  getMyStageRequests,
  getAllStageRequests,
  approveStagRequest,
  rejectStageRequest
};
