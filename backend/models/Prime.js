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
    required: true
  },
  type: {
    type: String,
    enum: ['performance', 'assiduité', 'productivité', 'autre'],
    default: 'autre'
  },
  description: String,
  mois: Number,
  annee: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

primeSchema.index({ employe: 1, date: 1 });

module.exports = mongoose.model('Prime', primeSchema);
