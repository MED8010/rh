const Employe = require('../models/Employe');
const User = require('../models/User');

// Créer un employé
const createEmploye = async (req, res) => {
  try {
    console.log('\n=== CRÉATION EMPLOYÉ ===');
    console.log('\n--- DEBUG: REQ.BODY ---');
    console.log(req.body);
    console.log('--- END DEBUG ---\n');
    let { matricule, nom, prenom, date_embauche, prix_heure, service, uap, email, telephone, adresse, solde_conge_total, password, role } = req.body;

    console.log('📥 Champs déstructurés:', { matricule, nom, prenom, date_embauche, prix_heure });

    // Conversion des types
    date_embauche = new Date(date_embauche);
    prix_heure = parseFloat(prix_heure);
    solde_conge_total = solde_conge_total ? parseInt(solde_conge_total) : 22;

    console.log('✅ Données converties:', { date_embauche, prix_heure, solde_conge_total });

    // Validation
    if (!matricule || !nom || !prenom || !service || !uap || !prix_heure) {
      console.error('❌ Champs obligatoires manquent');
      return res.status(400).json({ message: 'Les champs obligatoires manquent' });
    }

    if (isNaN(date_embauche.getTime())) {
      console.error('❌ Date d\'embauche invalide:', date_embauche);
      return res.status(400).json({ message: 'Date d\'embauche invalide' });
    }

    if (isNaN(prix_heure) || prix_heure <= 0) {
      console.error('❌ Prix/heure invalide:', prix_heure);
      return res.status(400).json({ message: 'Prix/heure doit être un nombre positif' });
    }

    const employe = new Employe({
      matricule,
      nom,
      prenom,
      date_embauche,
      prix_heure,
      service,
      uap,
      email,
      telephone,
      adresse,
      solde_conge_total,
      solde_conge_restant: solde_conge_total
    });

    console.log('💾 Sauvegarde de l\'employé...');
    await employe.save();
    console.log('✅ Employé sauvegardé:', employe._id);

    await employe.populate(['service', 'uap']);
    console.log('✅ Employé peuplé avec relations');

    // Créer un user si email et password sont fournis
    if (email && password) {
      try {
        console.log('📝 Tentative création user pour:', { email, password: password.length + ' chars', role: role || 'employe' });

        // Normaliser l'email
        const normalizedEmail = email.toLowerCase().trim();
        console.log('✅ Email normalisé:', normalizedEmail);

        // Vérifier si un user avec cet email existe déjà
        console.log('🔍 Vérification email existant...');
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
          console.warn('⚠️ Utilisateur avec cet email existe déjà:', normalizedEmail);
        } else {
          console.log('✅ Email disponible, création du user...');

          const userData = {
            email: normalizedEmail,
            password,
            role: role || 'employe',
            employe: employe._id
          };

          console.log('📊 Données user à créer:', {
            email: userData.email,
            role: userData.role,
            employe: userData.employe,
            passwordLength: userData.password.length
          });

          const user = new User(userData);

          console.log('🔍 Validation avant save...');
          const validationError = user.validateSync();
          if (validationError) {
            console.error('❌ Erreur validation schéma:');
            console.error('  Message:', validationError.message);
            console.error('  Erreurs:', validationError.errors);
            throw validationError;
          }

          console.log('💾 Sauvegarde du user...');
          const savedUser = await user.save();
          console.log('✅ User créé avec succès:', savedUser._id);
          console.log('   Email:', savedUser.email);
          console.log('   Rôle:', savedUser.role);

          employe.user = savedUser._id;
          await employe.save();
          console.log('✅ Employé lié au user:', savedUser._id);
        }
      } catch (userError) {
        console.error('\n❌ ERREUR CRÉATION USER:');
        console.error('Message:', userError.message);
        console.error('Code:', userError.code);
        console.error('Erreurs:', userError.errors);
        console.error('Stack:', userError.stack);
        console.error('\n');
        // Continuer même si la création du user échoue
      }
    } else {
      console.log('\n⚠️ EMAIL OU PASSWORD MANQUANT - USER NON CRÉÉ');
      console.log('   Email reçu:', !!email, email || '(VIDE)');
      console.log('   Password reçu:', !!password, password ? `(${password.length} chars)` : '(VIDE)');
      console.log('\n');
    }

    console.log('✅ Réponse final - Employé créé\n');

    // Ajouter info user à la réponse si créé
    let response = { message: 'Employé créé avec succès', employe };

    res.status(201).json(response);
  } catch (error) {
    console.error('\n❌ ERREUR COMPLÈTE:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Erreur complète:', error);
    console.error('\n');

    res.status(500).json({
      message: 'Erreur lors de la création de l\'employé',
      error: error.message,
      fullError: error,
      details: error.errors ? error.errors : 'N/A'
    });
  }
};

// Obtenir tous les employés
const getEmployes = async (req, res) => {
  try {
    const { service, uap, statut } = req.query;
    let filter = {};

    if (service) filter.service = service;
    if (uap) filter.uap = uap;
    if (statut) filter.statut = statut;

    const employes = await Employe.find(filter).populate(['service', 'uap', 'user']);
    res.json(employes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des employés', error: error.message });
  }
};

// Obtenir un employé
const getEmploye = async (req, res) => {
  try {
    const employe = await Employe.findById(req.params.id).populate(['service', 'uap', 'user']);
    if (!employe) {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }
    res.json(employe);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'employé', error: error.message });
  }
};

// Mettre à jour un employé
const updateEmploye = async (req, res) => {
  try {
    const { matricule, nom, prenom, date_embauche, prix_heure, service, uap, email, telephone, adresse, statut, solde_conge_restant } = req.body;

    const employe = await Employe.findByIdAndUpdate(
      req.params.id,
      {
        matricule,
        nom,
        prenom,
        date_embauche,
        prix_heure,
        service,
        uap,
        email,
        telephone,
        adresse,
        statut,
        solde_conge_restant,
        updatedAt: new Date()
      },
      { new: true }
    ).populate(['service', 'uap']);

    res.json({ message: 'Employé mis à jour avec succès', employe });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour', error: error.message });
  }
};

// Supprimer un employé
const deleteEmploye = async (req, res) => {
  try {
    // Supprimer l'utilisateur associé
    await User.deleteOne({ employe: req.params.id });
    // Supprimer l'employé
    await Employe.findByIdAndDelete(req.params.id);

    res.json({ message: 'Employé supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
  }
};

// Obtenir les statistiques des employés avec filtres
const getEmployeStats = async (req, res) => {
  try {
    const { service, uap } = req.query;
    let filter = { statut: 'actif' };

    if (service) filter.service = service;
    if (uap) filter.uap = uap;

    const totalEmployes = await Employe.countDocuments(filter);

    const employesParService = await Employe.aggregate([
      { $match: filter },
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } }
    ]);

    // Distribution géographique (Villes)
    const allEmployes = await Employe.find(filter).select('adresse');
    const villesDist = allEmployes.reduce((acc, emp) => {
      if (emp.adresse) {
        const parts = emp.adresse.split(',');
        const ville = parts.length > 2 ? parts[parts.length - 2].trim() : 'Inconnue';
        acc[ville] = (acc[ville] || 0) + 1;
      }
      return acc;
    }, {});

    const distributionGeographique = Object.entries(villesDist).map(([ville, count]) => ({
      ville,
      count
    })).sort((a, b) => b.count - a.count);

    res.json({
      totalEmployes,
      employesParService,
      distributionGeographique
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques', error: error.message });
  }
};

module.exports = { createEmploye, getEmployes, getEmploye, updateEmploye, deleteEmploye, getEmployeStats };
