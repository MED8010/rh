const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./backend/models/User');

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const email = 'test_1774353323779@rh.app';
    const newPassword = 'SuperAdmin123!';
    
    // On hache le mot de passe manuellement pour être sûr (même si le middleware s'en occupe normalement)
    // Mais ici on va passer par .save() pour que le middleware du modèle s'active.
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé avec cet email.');
      process.exit(1);
    }

    console.log(`👤 Utilisateur trouvé: ${user.email} (Rôle: ${user.role})`);
    user.password = newPassword;
    await user.save();

    console.log(`✅ Mot de passe réinitialisé avec succès pour ${email}`);
    console.log(`🔑 Nouveau mot de passe: ${newPassword}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }
}

resetPassword();
