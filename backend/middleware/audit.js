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
      // Déterminer l'action effectuée
      const pathParts = req.path.split('/');
      const moduleName = pathParts[2] || 'system';
      const resourceType = pathParts[3] || null;
      let action = 'view';
      let description = `${req.method} ${req.path}`;

      // Logique de détection intelligente
      if (moduleName === 'import') {
        action = 'import';
        description = `Importation de données (${resourceType || 'Excel'})`;
      } else if (moduleName === 'bi-export' || req.path.includes('export')) {
        action = 'export';
        description = `Exportation BI (${resourceType || 'Données'})`;
      } else if (req.path.includes('download') || req.path.includes('template')) {
        action = 'download';
        description = `Téléchargement de fichier / template`;
      } else if (req.method === 'POST') {
        action = 'create';
        description = `Création dans le module ${moduleName}`;
      } else if (req.method === 'PUT' || req.method === 'PATCH') {
        action = 'update';
        description = `Mise à jour dans le module ${moduleName}`;
      } else if (req.method === 'DELETE') {
        action = 'delete';
        description = `Suppression dans le module ${moduleName}`;
      } else if (req.method === 'GET') {
        action = 'view';
        description = `Consultation ${moduleName}`;
      }

      // Cas particuliers pour l'authentification M2M (Clé API)
      if (req.apiKey && !req.user) {
        description += ` (Via Clé API)`;
      }

      // Préparer les données pour le log d'audit
      const auditLogData = {
        action,
        module: moduleName,
        resource_type: resourceType,
        resource_id: pathParts[4] || null,
        description,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('user-agent'),
        date_action: new Date(),
        status: statusCode >= 400 ? 'failure' : 'success'
      };

      // N'ajouter l'utilisateur que s'il est présent (évite les erreurs de validation avec null)
      if (req.user && (req.user.id || req.user._id)) {
        auditLogData.user = req.user.id || req.user._id;
      }

      // Enregistrer dans la base de données
      const auditLog = new AuditLog(auditLogData);

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
