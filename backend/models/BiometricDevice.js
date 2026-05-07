const mongoose = require('mongoose');

const biometricDeviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de la pointeuse est requis'],
    trim: true
  },
  ip: {
    type: String,
    required: [true, "L'adresse IP est requise"],
    unique: true,
    trim: true
  },
  port: {
    type: Number,
    default: 4370
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSync: {
    type: Date
  },
  lastOnline: {
    type: Boolean,
    default: false
  },
  lastUserCount: {
    type: Number,
    default: 0
  },
  lastLogCount: {
    type: Number,
    default: 0
  },
  lastError: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BiometricDevice', biometricDeviceSchema);
