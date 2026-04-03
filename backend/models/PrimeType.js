const mongoose = require('mongoose');

const primeTypeSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  categorie: {
    type: String,
    enum: ['performance', 'assiduité', 'productivité', 'exceptionnelle', 'autre'],
    default: 'autre'
  },
  montant_par_defaut: {
    type: Number,
    min: 0,
    default: 0
  },
  est_imposable: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PrimeType', primeTypeSchema);
