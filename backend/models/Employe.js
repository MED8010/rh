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
  date_naissance: {
    type: Date,
    default: null
  },
  sexe: {
    type: String,
    enum: ['H', 'F'],
    default: null
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
  photo: String,
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

employeSchema.virtual('age').get(function() {
  if (!this.date_naissance) return null;
  const today = new Date();
  let age = today.getFullYear() - this.date_naissance.getFullYear();
  const monthDiff = today.getMonth() - this.date_naissance.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.date_naissance.getDate())) {
    age--;
  }
  return age;
});

employeSchema.virtual('anciennete_ans').get(function() {
  if (!this.date_embauche) return 0;
  const today = new Date();
  let years = today.getFullYear() - this.date_embauche.getFullYear();
  const monthDiff = today.getMonth() - this.date_embauche.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.date_embauche.getDate())) {
    years--;
  }
  return Math.max(0, years);
});

employeSchema.virtual('anciennete_jours').get(function() {
  if (!this.date_embauche) return 0;
  const today = new Date();
  const timeDiff = today - this.date_embauche;
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
});

employeSchema.set('toJSON', { virtuals: true });
employeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Employe', employeSchema);
