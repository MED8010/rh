const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  nom_service: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Service', serviceSchema);
