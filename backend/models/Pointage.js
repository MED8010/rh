const mongoose = require('mongoose');

const pointageSchema = new mongoose.Schema({
  employe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employe',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  heure_entree: {
    type: String,
    required: true
  },
  heure_sortie: String,
  retard_minutes: {
    type: Number,
    default: 0,
    min: 0
  },
  heures_travaillees: {
    type: Number,
    default: 0,
    min: 0
  },
  heures_supp: {
    type: Number,
    default: 0,
    min: 0
  },
  absence: {
    type: Boolean,
    default: false
  },
  motif_absence: String,
  validee: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ['manual', 'biometric'],
    default: 'manual'
  },
  zk_timestamp: Date
});

// Index pour les requêtes rapides
pointageSchema.index({ employe: 1, date: 1 });

module.exports = mongoose.model('Pointage', pointageSchema);
