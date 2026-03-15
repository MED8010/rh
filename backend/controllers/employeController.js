const Employe = require('../models/Employe');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration de multer pour les photos de profil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'backend/uploads/profiles';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Seules les images (jpeg, jpg, png, webp) sont autorisées'));
  }
}).single('photo');

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
    const employe = await Employe.findById(req.params.id);
    if (!employe) {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }

    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const { nom, prenom, email, telephone, adresse, statut, prix_heure, service, uap, solde_conge_restant, matricule } = req.body;

      // Vérification des droits
      const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
      const isOwner = employe.user && (employe.user.toString() === req.user.id);
      
      let finalHasAccess = isAdmin || isOwner;

      if (!finalHasAccess) {
        // Tenter de trouver le lien via l'utilisateur
        const userData = await User.findById(req.user.id);
        if (userData && userData.employe && userData.employe.toString() === req.params.id) {
          finalHasAccess = true;
        }
      }

      console.log(`AUTH CHECK [${req.method} ${req.originalUrl}]:`, {
        role: req.user.role,
        userId: req.user.id,
        employeId: req.params.id,
        isAdmin,
        isOwner,
        finalHasAccess
      });

      if (!finalHasAccess) {
        return res.status(403).json({ message: 'Accès non autorisé - Droits insuffisants' });
      }

      // Mise à jour des champs
      // Les non-admins ne peuvent pas modifier les champs sensibles
      if (isAdmin) {
        if (nom) employe.nom = nom;
        if (prenom) employe.prenom = prenom;
        if (statut) employe.statut = statut;
        if (prix_heure) employe.prix_heure = prix_heure;
        if (service) employe.service = service;
        if (uap) employe.uap = uap;
        if (solde_conge_restant) employe.solde_conge_restant = solde_conge_restant;
        if (matricule) employe.matricule = matricule;
      } else {
        // L'utilisateur modifie son propre profil
        // On autorise nom/prenom car l'admin peut toujours corriger si besoin
        // mais on priorise email, telephone, adresse
        if (nom) employe.nom = nom;
        if (prenom) employe.prenom = prenom;
      }

      // Champs modifiables par tout le monde (admin ou propriétaire)
      if (email) employe.email = email;
      if (telephone) employe.telephone = telephone;
      if (adresse) employe.adresse = adresse;

      if (req.file) {
        // Supprimer l'ancienne photo si elle existe
        if (employe.photo) {
          const oldPath = path.join('backend/uploads/profiles', employe.photo);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        employe.photo = req.file.filename;
      }

      employe.updatedAt = new Date();
      await employe.save();
      await employe.populate(['service', 'uap']);

      res.json({ message: 'Profil mis à jour avec succès', employe });
    });
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
