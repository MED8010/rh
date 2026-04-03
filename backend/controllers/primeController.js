const Prime = require('../models/Prime');
const PrimeType = require('../models/PrimeType');
const Employe = require('../models/Employe');
const AuditLog = require('../models/AuditLog');

// --- Prime Types CRUD ---

exports.getPrimeTypes = async (req, res) => {
  try {
    const types = await PrimeType.find().sort({ nom: 1 });
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des types de primes', error: error.message });
  }
};

exports.createPrimeType = async (req, res) => {
  try {
    const { nom, description, categorie, montant_par_defaut, est_imposable } = req.body;
    const existing = await PrimeType.findOne({ nom });
    if (existing) return res.status(400).json({ message: 'Ce type de prime existe déjà' });

    const newType = new PrimeType({ nom, description, categorie, montant_par_defaut, est_imposable });
    await newType.save();

    res.status(201).json(newType);
  } catch (error) {
    res.status(500).json({ message: 'Erreurs lors de la création du type de prime', error: error.message });
  }
};

exports.updatePrimeType = async (req, res) => {
  try {
    const type = await PrimeType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!type) return res.status(404).json({ message: 'Type de prime non trouvé' });
    res.json(type);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du type de prime', error: error.message });
  }
};

exports.deletePrimeType = async (req, res) => {
  try {
    const count = await Prime.countDocuments({ type_prime: req.params.id });
    if (count > 0) {
      return res.status(400).json({ message: 'Impossible de supprimer ce type : il est utilisé par des employés' });
    }
    const type = await PrimeType.findByIdAndDelete(req.params.id);
    if (!type) return res.status(404).json({ message: 'Type de prime non trouvé' });
    res.json({ message: 'Type de prime supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
  }
};

// --- Prime Assignment CRUD ---

exports.assignPrime = async (req, res) => {
  try {
    const { employe, montant, type_prime, mois, annee, description } = req.body;

    const emp = await Employe.findById(employe);
    if (!emp) return res.status(404).json({ message: 'Employé non trouvé' });

    const type = await PrimeType.findById(type_prime);
    if (!type) return res.status(404).json({ message: 'Type de prime non trouvé' });

    const newPrime = new Prime({
      employe,
      montant,
      type_prime,
      mois: parseInt(mois),
      annee: parseInt(annee),
      description,
      statut: 'en_attente'
    });

    await newPrime.save();

    // Log the audit
    const log = new AuditLog({
      user: req.user.id,
      action: 'create',
      module: 'Primes',
      resource_type: 'Prime',
      resource_id: newPrime._id,
      description: `Attribution d'une prime de ${montant} à ${emp.nom} ${emp.prenom}`,
      nouvelle_valeur: newPrime
    });
    await log.save();

    await newPrime.populate([
      { path: 'employe', select: 'nom prenom matricule' },
      { path: 'type_prime' }
    ]);

    res.status(201).json(newPrime);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l’attribution de la prime', error: error.message });
  }
};

exports.getPrimes = async (req, res) => {
  try {
    const { employe, mois, annee, type_prime } = req.query;
    let filter = {};

    if (employe) filter.employe = employe;
    if (mois) filter.mois = parseInt(mois);
    if (annee) filter.annee = parseInt(annee);
    if (type_prime) filter.type_prime = type_prime;

    const primes = await Prime.find(filter)
      .populate([
        { path: 'employe', select: 'nom prenom matricule' },
        { path: 'type_prime' }
      ])
      .sort({ date: -1 });

    res.json(primes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des primes', error: error.message });
  }
};

exports.deletePrime = async (req, res) => {
  try {
    const prime = await Prime.findByIdAndDelete(req.params.id);
    if (!prime) return res.status(404).json({ message: 'Prime non trouvée' });
    res.json({ message: 'Prime supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de la prime', error: error.message });
  }
};

exports.getPrimeStats = async (req, res) => {
  try {
    const { mois, annee } = req.query;
    const filter = {};
    if (mois) filter.mois = parseInt(mois);
    if (annee) filter.annee = parseInt(annee);

    const stats = await Prime.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalMontant: { $sum: '$montant' },
          count: { $sum: 1 }
        }
      }
    ]);

    const byType = await Prime.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type_prime',
          total: { $sum: '$montant' }
        }
      },
      {
        $lookup: {
          from: 'primetypes',
          localField: '_id',
          foreignField: '_id',
          as: 'details'
        }
      }
    ]);

    res.json({
      summary: stats[0] || { totalMontant: 0, count: 0 },
      byType
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur stats primes', error: error.message });
  }
};
