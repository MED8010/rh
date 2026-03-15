const mongoose = require('mongoose');

const disciplineSchema = new mongoose.Schema({
  employe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employe',
    required: true
  },
  type: {
    type: String,
    enum: ['avertissement', 'suspension', 'sanction_financière', 'licenciement', 'autre'],
    required: true
  },
  motif: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  montant_sanction: {
    type: Number,
    default: 0,
    min: 0
  },
  description: String,
  dure_suspension_jours: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

disciplineSchema.index({ employe: 1, date: 1 });

module.exports = mongoose.model('Discipline', disciplineSchema);
