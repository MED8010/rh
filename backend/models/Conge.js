const mongoose = require('mongoose');

const congeSchema = new mongoose.Schema({
  employe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employe',
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
  type: {
    type: String,
    enum: ['annuel', 'maladie', 'maternite', 'paternite', 'non_paye', 'autre'],
    default: 'annuel'
  },
  nombre_jours: {
    type: Number,
    required: true,
    min: 1
  },
  statut: {
    type: String,
    enum: ['demande', 'approuve', 'refuse'],
    default: 'demande'
  },
  motif: String,
  commentaire_rejet: String,
  valide_par: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  date_validation: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

congeSchema.index({ employe: 1, date_debut: 1 });

module.exports = mongoose.model('Conge', congeSchema);
