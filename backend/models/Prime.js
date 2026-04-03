const mongoose = require('mongoose');

const primeSchema = new mongoose.Schema({
  employe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employe',
    required: true
  },
  montant: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  type_prime: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrimeType',
    required: true
  },
  description: String,
  mois: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  annee: {
    type: Number,
    required: true,
    min: 2000
  },
  statut: {
    type: String,
    enum: ['payé', 'en_attente', 'annulé'],
    default: 'en_attente'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

primeSchema.index({ employe: 1, mois: 1, annee: 1 });

module.exports = mongoose.model('Prime', primeSchema);
