const AuditLog = require('../models/AuditLog');

const auditLog = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    if (req.user && (req.method !== 'GET' || req.query.audit === 'true')) {
      try {
        const auditEntry = new AuditLog({
          user: req.user.id,
          action: req.method === 'POST' ? 'create' : req.method === 'PUT' || req.method === 'PATCH' ? 'update' : 'delete',
          module: req.baseUrl.split('/')[2] || 'unknown',
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          date_action: new Date(),
          status: res.statusCode >= 400 ? 'failure' : 'success'
        });
        auditEntry.save().catch(err => console.error('Erreur audit log:', err));
      } catch (error) {
        console.error('Erreur lors de l\'audit:', error);
      }
    }

    originalSend.call(this, data);
  };

  next();
};

module.exports = auditLog;
