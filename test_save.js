const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./backend/models/User');

async function testUserUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Find any user
    const user = await User.findOne({}).select('+password');
    if (!user) {
      console.log('No users found.');
      process.exit(0);
    }

    console.log(`Found user: ${user.email}, ID: ${user._id}`);
    
    // Simulate email change
    const newEmail = `test_${Date.now()}@rh.app`;
    console.log(`Attempting to change email to: ${newEmail}`);
    user.email = newEmail;
    
    // Try to save
    try {
      await user.save();
      console.log('✅ User saved successfully!');
    } catch (saveError) {
      console.error('❌ VALIDATION ERROR on save():', saveError);
    }
    
    // Test the audit log generation exactly as the middleware would
    const AuditLog = require('./backend/models/AuditLog');
    try {
        const auditEntry = new AuditLog({
            user: user._id,
            action: 'update',
            module: 'employes',
            resource_id: new mongoose.Types.ObjectId(),
            description: "Modification du employé (ID: tests)",
            ip_address: "127.0.0.1",
            user_agent: "test",
            date_action: new Date(),
            status: 'success'
          });
          await auditEntry.save();
          console.log('✅ Audit log saved successfully!');
    } catch (err) {
        console.error('❌ VALIDATION ERROR on AuditLog.save():', err);
    }

    process.exit(0);
  } catch (err) {
    console.error('Core error:', err);
    process.exit(1);
  }
}

testUserUpdate();
