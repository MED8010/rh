const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const User = require('./backend/models/User');

const resetAdminPassword = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté\n');

    // Chercher l'admin
    console.log('🔍 Recherche de admin@rh.app...');
    const admin = await User.findOne({ email: 'admin@rh.app' });
    
    if (!admin) {
      console.log('❌ Utilisateur admin@rh.app non trouvé');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${admin.email}`);
    console.log(`   ID: ${admin._id}`);
    console.log(`   Rôle: ${admin.role}\n`);

    // Réinitialiser le password
    const newPassword = 'admin123456';
    console.log(`🔐 Réinitialisation du mot de passe à: ${newPassword}`);
    
    admin.password = newPassword;
    await admin.save();

    console.log('✅ Mot de passe réinitialisé avec succès!\n');
    console.log('Credentials de test:');
    console.log(`  Email: admin@rh.app`);
    console.log(`  Password: ${newPassword}\n`);

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

resetAdminPassword();
