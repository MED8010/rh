const mongoose = require('mongoose');

const zkLogSchema = new mongoose.Schema({
  deviceIp: { type: String, required: true },
  deviceName: { type: String, required: true },
  type: { type: String, enum: ['sync', 'status_check'], required: true },
  status: { type: String, enum: ['success', 'error'], required: true },
  message: String,
  details: Object,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ZkLog', zkLogSchema);
