const AuditLog = require('../models/AuditLog');

const auditLog = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    if (req.user && (req.method !== 'GET' || req.query.audit === 'true')) {
      try {
        const urlParts = req.originalUrl.split('?')[0].split('/');
        const moduleName = urlParts[2] || 'unknown';
        const action = req.method === 'POST' ? 'create' : (req.method === 'PUT' || req.method === 'PATCH') ? 'update' : req.method === 'DELETE' ? 'delete' : 'view';
        
        // Tentative de récupération de l'ID de la ressource depuis l'URL (index 3) ou le body/param
        let resourceId = urlParts[3];
        if (!resourceId && data) {
          try {
            const parsedData = JSON.parse(data);
            resourceId = parsedData._id || (parsedData.employe ? parsedData.employe._id : null);
          } catch (e) {}
        }

        // Génération d'une description lisible
        const moduleMap = {
          'employes': 'employé',
          'conges': 'congé',
          'pointages': 'pointage',
          'salaires': 'salaire',
          'users': 'utilisateur',
          'biometric': 'appareil biométrique',
          'structure': 'structure (UAP/Service)',
          'audit': 'journaux d\'audit',
          'notifications': 'notification'
        };

        const friendlyModule = moduleMap[moduleName] || moduleName;
        let description = '';

        if (req.auditDescription) {
          description = req.auditDescription;
        } else {
          switch (action) {
            case 'create': description = `Création d'un nouveau ${friendlyModule}`; break;
            case 'update': description = `Modification du ${friendlyModule}${resourceId ? ` (ID: ${resourceId})` : ''}`; break;
            case 'delete': description = `Suppression du ${friendlyModule}${resourceId ? ` (ID: ${resourceId})` : ''}`; break;
            case 'approve': description = `Approbation du ${friendlyModule}`; break;
            case 'reject': description = `Rejet du ${friendlyModule}`; break;
            default: description = `${action} sur le module ${friendlyModule}`;
          }
        }

        const auditEntry = new AuditLog({
          user: req.user.id,
          action: action,
          module: moduleName,
          resource_id: resourceId && /^[0-9a-fA-F]{24}$/.test(resourceId) ? resourceId : null,
          description: description,
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
