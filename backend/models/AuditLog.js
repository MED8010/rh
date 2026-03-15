const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'view', 'download', 'approve', 'reject', 'calculate', 'validate'],
    required: true
  },
  module: {
    type: String,
    required: true
  },
  resource_type: String,
  resource_id: mongoose.Schema.Types.ObjectId,
  description: String,
  ancienne_valeur: mongoose.Schema.Types.Mixed,
  nouvelle_valeur: mongoose.Schema.Types.Mixed,
  ip_address: String,
  user_agent: String,
  date_action: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  }
});

auditLogSchema.index({ user: 1, date_action: -1 });
auditLogSchema.index({ module: 1, date_action: -1 });
auditLogSchema.index({ resource_type: 1, resource_id: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
