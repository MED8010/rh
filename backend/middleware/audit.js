const AuditLog = require('../models/AuditLog');

/**
 * Middleware d'audit global
 * Enregistre automatiquement les actions effectuées sur l'API
 */
const auditMiddleware = async (req, res, next) => {
  // Intercepter la méthode json() de la réponse pour capturer les données envoyées
  const originalJson = res.json;
  let responseData = null;
  let statusCode = null;

  res.json = function(data) {
    responseData = data;
    statusCode = res.statusCode;
    return originalJson.call(this, data);
  };

  // Continuer au prochain middleware
  res.on('finish', async () => {
    try {
      // Ne pas enregistrer les requêtes de health check et certaines routes
      const skipPaths = ['/api/health', '/swagger', '/docs', '/uploads'];
      if (skipPaths.some(path => req.path.startsWith(path))) {
        return;
      }

      // Déterminer l'action effectuée
      let action = 'view'; // Par défaut
      if (req.method === 'POST') action = 'create';
      else if (req.method === 'PUT' || req.method === 'PATCH') action = 'update';
      else if (req.method === 'DELETE') action = 'delete';
      else if (req.method === 'GET') action = 'view';

      // Déterminer le module (en fonction du chemin)
      const pathParts = req.path.split('/');
      const module = pathParts[2] || 'unknown'; // /api/{module}/...

      // Enregistrer dans la base de données
      const auditLog = new AuditLog({
        user: req.user?.id || null, // Peut être null si utilisateur non authentifié
        action,
        module,
        resource_type: pathParts[3] || null,
        resource_id: pathParts[4] || null,
        description: `${req.method} ${req.path}`,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('user-agent'),
        date_action: new Date(),
        status: statusCode >= 400 ? 'failure' : 'success'
      });

      await auditLog.save().catch(err => {
        console.error('Erreur lors de la sauvegarde du log d\'audit:', err);
      });
    } catch (error) {
      // Ne pas bloquer la requête si l'audit échoue
      console.error('Erreur audit middleware:', error);
    }
  });

  next();
};

module.exports = auditMiddleware;
