const User = require('../models/User');
const Employe = require('../models/Employe');
const jwt = require('jsonwebtoken');

// Créer un token JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Inscription
const register = async (req, res) => {
  try {
    const { email, password, nom, prenom, matricule, service, uap, prix_heure } = req.body;

    // Vérifier si l'utilisateur existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Créer l'employé
    const employe = new Employe({
      nom,
      prenom,
      matricule,
      service,
      uap,
      prix_heure,
      date_embauche: new Date()
    });
    await employe.save();

    // Créer l'utilisateur
    const user = new User({
      email,
      password,
      role: 'employe',
      employe: employe._id
    });
    await user.save();

    const token = generateToken(user);
    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription', error: error.message });
  }
};

// Connexion
const login = async (req, res) => {
  try {
    console.log('\n=== TENTATIVE CONNEXION ===');
    const { email, password } = req.body;

    console.log('📧 Email reçu:', email);
    console.log('🔐 Password reçu:', password ? `${password.length} chars` : 'VIDE');

    // Normaliser l'email comme dans la BD
    const normalizedEmail = email.toLowerCase().trim();
    console.log('✅ Email normalisé:', normalizedEmail);

    console.log('🔍 Recherche utilisateur dans la BD...');
    const user = await User.findOne({ email: normalizedEmail }).select('+password').populate('employe');

    if (!user) {
      console.error('❌ Utilisateur NON TROUVÉ avec email:', normalizedEmail);

      // Afficher tous les users pour déboguer
      const allUsers = await User.find({}, 'email role');
      console.log('📋 Utilisateurs existants:', allUsers.map(u => `${u.email} (${u.role})`));

      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    console.log('✅ Utilisateur trouvé:', user._id);
    console.log('   Email:', user.email);
    console.log('   Rôle:', user.role);
    console.log('   Password hash length:', user.password.length);

    console.log('🔐 Vérification du mot de passe...');
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      console.error('❌ Mot de passe INVALIDE');
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    console.log('✅ Mot de passe VALIDE');

    const token = generateToken(user);
    console.log('✅ Token généré');
    console.log('\n');

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employe: user.employe
      }
    });
  } catch (error) {
    console.error('\n❌ ERREUR CONNEXION:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('\n');
    res.status(500).json({ message: 'Erreur lors de la connexion', error: error.message });
  }
};

// Obtenir le profil actuel
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('employe');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil', error: error.message });
  }
};

module.exports = { register, login, getProfile };
