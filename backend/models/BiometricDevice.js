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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BiometricDevice', biometricDeviceSchema);
