const Employe = require('../models/Employe');
const User = require('../models/User');
const Service = require('../models/Service');
const UAP = require('../models/UAP');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

// Configuration de multer pour les photos de profil

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

// Configuration de multer pour les fichiers Excel
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'backend/uploads/excel';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, 'import-' + Date.now() + path.extname(file.originalname));
  }
});

const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    const filetypes = /xlsx|xls|csv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Seuls les fichiers Excel (.xlsx, .xls) ou CSV sont autorisés'));
  }
}).single('file');

// Créer un employé
const createEmploye = async (req, res) => {
  try {
    console.log('\n=== CRÉATION EMPLOYÉ ===');
    console.log('\n--- DEBUG: REQ.BODY ---');
    console.log(req.body);
    console.log('--- END DEBUG ---\n');
    let { matricule, nom, prenom, date_naissance, sexe, date_embauche, prix_heure, service, uap, email, telephone, adresse, solde_conge_total, password, role } = req.body;

    console.log('📥 Champs déstructurés:', { matricule, nom, prenom, date_naissance, date_embauche, prix_heure });

    // Conversion des types
    if (date_naissance) date_naissance = new Date(date_naissance);
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
      date_naissance: date_naissance || null,
      sexe: sexe || null,
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

      const { nom, prenom, email, telephone, adresse, statut, prix_heure, service, uap, solde_conge_restant, matricule, password, role, sexe } = req.body;

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

      // Mise à jour des champs de l'employé
      if (isAdmin) {
        if (nom) employe.nom = nom;
        if (prenom) employe.prenom = prenom;
        if (req.body.date_naissance) employe.date_naissance = new Date(req.body.date_naissance);
        if (sexe) employe.sexe = sexe;
        if (statut) employe.statut = statut;
        if (prix_heure) employe.prix_heure = prix_heure;
        if (service) employe.service = service;
        if (uap) employe.uap = uap;
        if (solde_conge_restant) employe.solde_conge_restant = solde_conge_restant;
        if (matricule) employe.matricule = matricule;
      } else {
        if (nom) employe.nom = nom;
        if (prenom) employe.prenom = prenom;
      }

      if (email) employe.email = email;
      if (telephone) employe.telephone = telephone;
      if (adresse) employe.adresse = adresse;

      if (req.file) {
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

      // 🔄 Synchronisation avec le compte utilisateur
      try {
        console.log(`\n🔄 SYNC START for Employe: ${employe._id} (${employe.matricule})`);
        
        // Tentative de trouver l'utilisateur par les deux bouts de la relation
        // Important: +password pour éviter l'erreur de validation "password is required" lors de save()
        let linkedUser = await User.findOne({ employe: employe._id }).select('+password');
        if (!linkedUser && employe.user) {
          console.log(`🔍 User not found by {employe: ID}, trying by _id: ${employe.user}`);
          linkedUser = await User.findById(employe.user).select('+password');
        }

        if (linkedUser) {
          console.log(`✅ Linked User found: ${linkedUser._id} (${linkedUser.email})`);
          let userModified = false;

          // Mise à jour de l'email si nécessaire
          if (email) {
            const normalizedEmail = email.toLowerCase().trim();
            if (linkedUser.email !== normalizedEmail) {
              console.log(`   📧 Synchronisation email: ${linkedUser.email} -> ${normalizedEmail}`);
              linkedUser.email = normalizedEmail;
              userModified = true;
            } else {
              console.log(`   📧 Email already matches: ${normalizedEmail}`);
            }
          }

          // Mise à jour du mot de passe si fourni
          if (password && password.trim() !== '') {
            console.log(`   🔑 Synchronisation mot de passe (${password.length} chars)`);
            linkedUser.password = password; // Sera haché par le middleware pre-save
            userModified = true;
          }

          // Mise à jour du rôle (admin seulement)
          if (isAdmin && role) {
            if (linkedUser.role !== role) {
              console.log(`   👑 Synchronisation rôle: ${linkedUser.role} -> ${role}`);
              linkedUser.role = role;
              userModified = true;
            }
          }

          if (userModified) {
            console.log(`   💾 Sauvegarde de l'utilisateur synchronisé...`);
            await linkedUser.save();
            console.log(`✅ Compte utilisateur synchronisé avec succès`);
          } else {
            console.log(`   ⏭️ Aucune modification nécessaire pour l'utilisateur`);
          }
        } else {
          console.warn(`⚠️ Aucun compte utilisateur trouvé pour l'employé ${employe._id}`);
          console.log(`   Email fourni dans la requête: ${email}`);
          console.log(`   L'employé a-t-il un champ 'user'? ${!!employe.user}`);
        }
        console.log(`🔄 SYNC END\n`);
      } catch (syncError) {
        console.error('❌ ERREUR SYNC UTILISATEUR:', syncError);
      }

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
    let filter = {}; // Relaxed filter to include all by default for dashboard counts

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

// Exporter les employés en Excel
const exportEmployes = async (req, res) => {
  try {
    const employes = await Employe.find().populate(['service', 'uap']);
    
    const data = employes.map(emp => ({
      'Matricule': emp.matricule,
      'Nom': emp.nom,
      'Prénom': emp.prenom,
      'Genre': emp.sexe === 'H' ? 'Homme' : emp.sexe === 'F' ? 'Femme' : 'Inconnu',
      'Date de Naissance': emp.date_naissance ? new Date(emp.date_naissance).toLocaleDateString('fr-FR') : '',
      'Email': emp.email || '',
      'Téléphone': emp.telephone || '',
      'Service': emp.service ? emp.service.nom_service : '',
      'UAP': emp.uap ? emp.uap.nom_uap : '',
      'Statut': emp.statut,
      'Prix/Heure (DT)': emp.prix_heure,
      'Solde Congé Restant': emp.solde_conge_restant,
      'Date Embauche': emp.date_embauche ? new Date(emp.date_embauche).toLocaleDateString('fr-FR') : '',
      'Adresse': emp.adresse || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employés');

    // Générer le buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=employes.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Erreur export Excel:', error);
    res.status(500).json({ message: 'Erreur lors de l\'exportation Excel', error: error.message });
  }
};

// Importer les employés via Excel
const importEmployes = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier n\'a été téléchargé' });
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: null });

    // Charger services et UAPs pour mise en correspondance
    const [services, uaps] = await Promise.all([
      Service.find(),
      UAP.find()
    ]);

    const results = {
      created: 0,
      updated: 0,
      errors: [],
      skipped: 0
    };

    // Helper pour chercher une valeur par plusieurs noms de colonnes possibles
    const getVal = (row, columnNames) => {
      for (const name of columnNames) {
        const key = Object.keys(row).find(k => k.toLowerCase().trim() === name.toLowerCase().trim());
        if (key && row[key] !== null && row[key] !== undefined && row[key] !== '') {
          return row[key];
        }
      }
      return null;
    };

    console.log(`🚀 Début import Excel: ${rawData.length} lignes trouvées dans la feuille "${sheetName}"`);

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      try {
        const matricule = getVal(row, ['Matricule', 'MAT', 'ID', 'Code', 'matricule']);
        if (!matricule) {
          console.warn(`⚠️ Ligne ${i + 2}: Matricule manquant, ligne sautée.`);
          results.skipped++;
          continue;
        }

        const nom = getVal(row, ['Nom', 'NAME', 'LAST NAME', 'nom']) || '';
        const prenom = getVal(row, ['Prénom', 'Prenom', 'FIRST NAME', 'prenom']) || '';
        const email = getVal(row, ['Email', 'E-mail', 'email']) || '';
        const serviceName = getVal(row, ['Service', 'DEPARTEMENT', 'Dept', 'service']);
        const uapName = getVal(row, ['UAP', 'UNIT', 'Unit', 'uap']);
        
        let prixHeureRaw = getVal(row, ['Prix/Heure', 'Prix/Heure (DT)', 'Prix Heure', 'Taux', 'prix_heure']);
        if (typeof prixHeureRaw === 'string') {
          prixHeureRaw = prixHeureRaw.replace(',', '.');
        }
        const prixHeure = parseFloat(prixHeureRaw || 0);

        // Trouver les IDs pour service et UAP
        const service = services.find(s => s.nom_service.toLowerCase().trim() === (serviceName || '').toString().toLowerCase().trim());
        const uap = uaps.find(u => u.nom_uap.toLowerCase().trim() === (uapName || '').toString().toLowerCase().trim());

        if (!service || !uap) {
          results.errors.push(`Ligne ${i + 2} (Matricule ${matricule}): Structure introuvable (Service: ${serviceName || 'N/A'}, UAP: ${uapName || 'N/A'})`);
          continue;
        }

        // Normalisation du Genre (Sexe)
        let sexeRaw = getVal(row, ['Genre', 'Sexe', 'Gender', 'sexe']) || 'H';
        let sexe = 'H';
        if (sexeRaw) {
          const s = sexeRaw.toString().toUpperCase().trim();
          if (['F', 'FEMME', 'FEMININ', 'FEMALE'].includes(s)) sexe = 'F';
          else if (['M', 'H', 'HOMME', 'MASCULIN', 'MALE'].includes(s)) sexe = 'H';
        }

        // Gestion de la Date de Naissance
        let dateNaissance = null;
        const dnRaw = getVal(row, ['Date de Naissance', 'Date Naissance', 'Naissance', 'Birthdate', 'DOB']);
        if (dnRaw) {
          if (typeof dnRaw === 'number') {
            dateNaissance = new Date((dnRaw - 25569) * 86400 * 1000);
          } else {
            dateNaissance = new Date(dnRaw);
          }
        }

        // Gestion de la Date d'Embauche
        let dateEmbauche = new Date();
        const deRaw = getVal(row, ['Date Embauche', 'Date Emba', 'Embauche', 'Hire Date', 'date_embauche']);
        if (deRaw) {
          if (typeof deRaw === 'number') {
            dateEmbauche = new Date((deRaw - 25569) * 86400 * 1000);
          } else {
            dateEmbauche = new Date(deRaw);
          }
        }

        // Normalisation du Statut (Gérer CDI, CIVP... -> actif)
        let statutRaw = getVal(row, ['Statut', 'Status', 'statut']) || 'actif';
        const validStatus = ['actif', 'inactif', 'conge', 'suspendu'];
        let statut = validStatus.includes(statutRaw.toLowerCase()) ? statutRaw.toLowerCase() : 'actif';

        const employeData = {
          nom,
          prenom,
          email,
          telephone: getVal(row, ['Téléphone', 'Telephone', 'Tél', 'Phone']) || '',
          adresse: getVal(row, ['Adresse', 'Address', 'adresse']) || '',
          prix_heure: prixHeure,
          service: service._id,
          uap: uap._id,
          statut,
          sexe,
          date_naissance: dateNaissance,
          date_embauche: dateEmbauche
        };

        let employe = await Employe.findOne({ matricule: matricule.toString() });

        if (employe) {
          Object.assign(employe, employeData);
          employe.updatedAt = new Date();
          await employe.save();
          results.updated++;
        } else {
          employe = new Employe({
            matricule: matricule.toString(),
            ...employeData,
            solde_conge_total: parseFloat(getVal(row, ['Solde Congé Total', 'Solde Total', 'Solde Congé']) || 22),
            solde_conge_restant: parseFloat(getVal(row, ['Solde Congé Restant', 'Solde Restant', 'Solde Congé']) || 22)
          });
          await employe.save();
          results.created++;
        }
      } catch (err) {
        results.errors.push(`Erreur ligne ${i + 2}: ${err.message}`);
      }
    }

    // Supprimer le fichier temporaire
    fs.unlinkSync(req.file.path);

    console.log(`🏁 Fin import: ${results.created} créés, ${results.updated} mis à jour, ${results.errors.length} erreurs`);

    res.json({
      message: 'Importation terminée',
      details: results
    });
  } catch (error) {
    console.error('Erreur import Excel:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Erreur lors de l\'importation', error: error.message });
  }
};

// Obtenir l'équipe du chef de service (même service)
const getMyTeam = async (req, res) => {
  try {
    // 1. Trouver l'employé lié au user connecté
    const currentUser = await User.findById(req.user.id).populate('employe');
    if (!currentUser || !currentUser.employe) {
      return res.status(404).json({ message: 'Profil employé non trouvé' });
    }

    const myServiceId = currentUser.employe.service;
    if (!myServiceId) {
      return res.status(400).json({ message: 'Aucun service assigné à votre profil' });
    }

    // 2. Trouver tous les employés du même service
    const teamMembers = await Employe.find({ service: myServiceId })
      .populate('service', 'nom_service')
      .populate('uap', 'nom_uap')
      .sort({ nom: 1 });

    // 3. Charger les pointages du jour pour l'équipe
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const Pointage = require('../models/Pointage');
    const todayPointages = await Pointage.find({
      employe: { $in: teamMembers.map(e => e._id) },
      date: { $gte: today, $lt: tomorrow }
    }).populate('employe', 'nom prenom matricule');

    // 4. Charger les congés en cours et en attente de l'équipe
    const Conge = require('../models/Conge');
    const teamConges = await Conge.find({
      employe: { $in: teamMembers.map(e => e._id) },
      $or: [
        { statut: 'demande' },
        { statut: 'approuve', date_fin: { $gte: today } }
      ]
    }).populate('employe', 'nom prenom matricule').sort({ createdAt: -1 });

    // 5. Calculer les stats
    const presentIds = new Set(todayPointages.map(p => p.employe?._id?.toString()));
    const enCongeIds = new Set(
      teamConges
        .filter(c => c.statut === 'approuve' && new Date(c.date_debut) <= today && new Date(c.date_fin) >= today)
        .map(c => c.employe?._id?.toString())
    );

    const stats = {
      total: teamMembers.length,
      presents: presentIds.size,
      absents: teamMembers.length - presentIds.size - enCongeIds.size,
      enConge: enCongeIds.size,
      congesEnAttente: teamConges.filter(c => c.statut === 'demande').length,
      retardsAujourdhui: todayPointages.filter(p => p.retard_minutes > 0).length,
      totalRetardMinutes: todayPointages.reduce((sum, p) => sum + (p.retard_minutes || 0), 0),
    };

    // 6. Enrichir les membres avec leur statut du jour
    const enrichedMembers = teamMembers.map(member => {
      const memberIdStr = member._id.toString();
      const pointage = todayPointages.find(p => p.employe?._id?.toString() === memberIdStr);
      const isEnConge = enCongeIds.has(memberIdStr);

      return {
        ...member.toObject(),
        statut_jour: isEnConge ? 'conge' : pointage ? 'present' : 'absent',
        heure_entree: pointage?.heure_entree || null,
        heure_sortie: pointage?.heure_sortie || null,
        retard_minutes: pointage?.retard_minutes || 0,
      };
    });

    res.json({
      service: await require('../models/Service').findById(myServiceId),
      stats,
      membres: enrichedMembers,
      pointages_jour: todayPointages,
      conges: teamConges
    });

  } catch (error) {
    console.error('❌ Erreur getMyTeam:', error);
    res.status(500).json({ message: 'Erreur lors du chargement de l\'équipe', error: error.message });
  }
};

module.exports = { 
  createEmploye, 
  getEmployes, 
  getEmploye, 
  updateEmploye, 
  deleteEmploye, 
  getEmployeStats,
  exportEmployes,
  importEmployes,
  uploadExcel,
  getMyTeam
};
