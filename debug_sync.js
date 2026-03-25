const mongoose = require('mongoose');
require('dotenv').config();
const Employe = require('./backend/models/Employe');
const User = require('./backend/models/User');

async function debugSync() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const employes = await Employe.find().limit(5);
    console.log(`Found ${employes.length} employees`);

    for (const emp of employes) {
      console.log(`\nEmployee: ${emp.prenom} ${emp.nom} (${emp.email})`);
      console.log(`  _id: ${emp._id}`);
      console.log(`  user field in Employe: ${emp.user}`);

      const userDirect = await User.findOne({ employe: emp._id });
      console.log(`  User found by { employe: emp._id }: ${userDirect ? userDirect.email : 'NOT FOUND'}`);
      
      if (emp.user) {
        const userById = await User.findById(emp.user);
        console.log(`  User found by _id (emp.user): ${userById ? userById.email : 'NOT FOUND'}`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugSync();
