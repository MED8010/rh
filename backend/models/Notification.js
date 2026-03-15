const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['conge_demande', 'conge_approuve', 'conge_refuse', 'stage_demande', 'stage_approuve', 'stage_refuse', 'salaire_disponible', 'autre'],
    required: true
  },
  titre: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  reference_id: {
    type: mongoose.Schema.Types.ObjectId,
    description: 'ID of the related document (Conge, StageRequest, Salaire, etc)'
  },
  lu: {
    type: Boolean,
    default: false
  },
  date_creation: {
    type: Date,
    default: Date.now
  },
  date_lecture: Date
});

module.exports = mongoose.model('Notification', notificationSchema);
