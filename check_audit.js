const mongoose = require('mongoose');
require('dotenv').config();
const AuditLog = require('./backend/models/AuditLog');

async function checkAudit() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const lastLogs = await AuditLog.find().sort({ date_action: -1 }).limit(10);
    console.log(`Last 10 logs:`);
    lastLogs.forEach(l => {
      console.log(`[${l.date_action.toISOString()}] ${l.module} - ${l.action}: ${l.description || '(EMPTY)'}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAudit();
