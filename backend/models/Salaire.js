const mongoose = require('mongoose');

const salaireSchema = new mongoose.Schema({
  employe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employe',
    required: true
  },
  mois: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  annee: {
    type: Number,
    required: true
  },
  heures_normales: {
    type: Number,
    default: 0,
    min: 0
  },
  heures_supp: {
    type: Number,
    default: 0,
    min: 0
  },
  prix_heure: {
    type: Number,
    required: true,
    min: 0
  },
  salaire_base: {
    type: Number,
    default: 0,
    min: 0
  },
  primes_total: {
    type: Number,
    default: 0,
    min: 0
  },
  deductions: {
    type: Number,
    default: 0,
    min: 0
  },
  absences_deductions: {
    type: Number,
    default: 0,
    min: 0
  },
  retards_deductions: {
    type: Number,
    default: 0,
    min: 0
  },
  salaire_brut: {
    type: Number,
    default: 0,
    min: 0
  },
  salaire_net: {
    type: Number,
    default: 0,
    min: 0
  },
  statut: {
    type: String,
    enum: ['brouillon', 'calcule', 'valide', 'paye'],
    default: 'brouillon'
  },
  validee: {
    type: Boolean,
    default: false
  },
  valide_par: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  date_validation: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

salaireSchema.index({ employe: 1, mois: 1, annee: 1 });

module.exports = mongoose.model('Salaire', salaireSchema);
