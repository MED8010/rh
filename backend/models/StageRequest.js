const mongoose = require('mongoose');

const stageRequestSchema = new mongoose.Schema({
  employe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employe',
    required: true
  },
  titre: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  domaine: {
    type: String,
    enum: ['informatique', 'ressources_humaines', 'finance', 'marketing', 'autre'],
    required: true
  },
  date_debut: {
    type: Date,
    required: true
  },
  date_fin: {
    type: Date,
    required: true
  },
  entreprise: {
    type: String,
    required: true
  },
  statut: {
    type: String,
    enum: ['en_attente', 'approuve', 'refuse', 'annule'],
    default: 'en_attente'
  },
  approuve_par: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  motif_refus: String,
  date_approuve: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StageRequest', stageRequestSchema);
