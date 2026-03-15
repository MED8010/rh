const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./backend/models/User');
const Employe = require('./backend/models/Employe');
const Service = require('./backend/models/Service');
const UAP = require('./backend/models/UAP');

const resetDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connecté à MongoDB');

    // Supprimer tous les documents
    await User.deleteMany({});
    await Employe.deleteMany({});
    await Service.deleteMany({});
    await UAP.deleteMany({});
    console.log('✓ Base de données vidée');

    // Créer les services
    const services = await Service.insertMany([
      { nom_service: 'Informatique' },
      { nom_service: 'RH' },
      { nom_service: 'Finance' },
    ]);
    console.log('✓ Services créés');

    // Créer les UAP
    const uaps = await UAP.insertMany([
      { nom_uap: 'UAP 1' },
      { nom_uap: 'UAP 2' },
    ]);
    console.log('✓ UAP créées');

    // Créer admin
    const adminEmp = await Employe.create({
      matricule: 'ADM001',
      nom: 'Admin',
      prenom: 'System',
      date_embauche: new Date(),
      prix_heure: 500,
      service: services[0]._id,
      uap: uaps[0]._id,
      statut: 'actif'
    });

    await User.create({
      email: 'admin@rh.app',
      password: 'admin123456',
      role: 'admin',
      employe: adminEmp._id
    });
    console.log('✓ Admin créé: admin@rh.app / admin123456');

    // Créer employé 1
    const emp1 = await Employe.create({
      matricule: 'EMP001',
      nom: 'Dupont',
      prenom: 'Jean',
      date_embauche: new Date(),
      prix_heure: 350,
      service: services[0]._id,
      uap: uaps[0]._id,
      statut: 'actif'
    });

    await User.create({
      email: 'jean.dupont@rh.app',
      password: 'emp123456',
      role: 'employe',
      employe: emp1._id
    });
    console.log('✓ Employé 1 créé: jean.dupont@rh.app / emp123456');

    // Créer employé 2
    const emp2 = await Employe.create({
      matricule: 'EMP002',
      nom: 'Martin',
      prenom: 'Marie',
      date_embauche: new Date(),
      prix_heure: 300,
      service: services[1]._id,
      uap: uaps[1]._id,
      statut: 'actif'
    });

    await User.create({
      email: 'marie.martin@rh.app',
      password: 'emp123456',
      role: 'employe',
      employe: emp2._id
    });
    console.log('✓ Employé 2 créé: marie.martin@rh.app / emp123456');

    console.log('\n✅ Base de données prête!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

resetDB();
