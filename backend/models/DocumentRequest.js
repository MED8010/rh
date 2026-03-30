const mongoose = require('mongoose');

const documentRequestSchema = new mongoose.Schema({
  employe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employe',
    required: true
  },
  type_document: {
    type: String,
    required: true
  },
  message: {
    type: String,
    trim: true
  },
  statut: {
    type: String,
    enum: ['en_attente', 'traite', 'rejete', 'annule'],
    default: 'en_attente'
  },
  fichier_joint: {
    type: String, // Nom du fichier sur le serveur
    default: null
  },
  traite_par: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  commentaire_admin: {
    type: String,
    trim: true
  },
  date_demande: {
    type: Date,
    default: Date.now
  },
  date_traitement: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DocumentRequest', documentRequestSchema);
