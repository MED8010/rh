const mongoose = require('mongoose');
require('dotenv').config();
const Employe = require('./backend/models/Employe');
const User = require('./backend/models/User');

async function fixLinks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const users = await User.find();
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      if (user.employe) {
        const emp = await Employe.findById(user.employe);
        if (emp) {
          console.log(`✅ User ${user.email} is linked to Employe ${emp.matricule}`);
          if (!emp.user || emp.user.toString() !== user._id.toString()) {
            console.log(`   🔸 Fixing Employe.user link...`);
            emp.user = user._id;
            await emp.save();
          }
        } else {
          console.log(`❌ User ${user.email} has invalid employe ID: ${user.employe}`);
        }
      } else {
        // Try to find employee by email
        const emp = await Employe.findOne({ email: user.email });
        if (emp) {
          console.log(`🔗 Found matching employee by email for user ${user.email}. Fixing bidirectional link.`);
          user.employe = emp._id;
          await user.save();
          emp.user = user._id;
          await emp.save();
        } else {
          console.log(`⚠️ User ${user.email} has no linked employee and no matching email found.`);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixLinks();
