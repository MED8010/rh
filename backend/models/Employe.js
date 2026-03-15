const mongoose = require('mongoose');

const employeSchema = new mongoose.Schema({
  matricule: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  date_embauche: {
    type: Date,
    required: true
  },
  prix_heure: {
    type: Number,
    required: true,
    min: 0
  },
  solde_conge_total: {
    type: Number,
    default: 22,
    min: 0
  },
  solde_conge_restant: {
    type: Number,
    default: 22,
    min: 0
  },
  statut: {
    type: String,
    enum: ['actif', 'inactif', 'conge', 'suspendu'],
    default: 'actif'
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  uap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UAP',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  telephone: String,
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  adresse: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

employeSchema.virtual('nom_complet').get(function() {
  return `${this.prenom} ${this.nom}`;
});

module.exports = mongoose.model('Employe', employeSchema);
