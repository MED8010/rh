/**
 * Middleware pour vérifier les rôles de l'utilisateur
 * @param {Array<string>} allowedRoles - Liste des rôles autorisés
 * @returns {Function} Middleware Express
 */
const checkRole = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      // Vérifier que l'utilisateur est authentifié (ajouté par verifyToken)
      if (!req.user) {
        return res.status(401).json({ message: 'Utilisateur non authentifié' });
      }

      // Vérifier que le rôle est dans la liste des rôles autorisés
      if (!allowedRoles.includes(req.user.role)) {
        console.warn(`⛔ Accès refusé: L'utilisateur ${req.user.email} (${req.user.role}) n'a pas les permissions pour ${req.originalUrl}`);
        return res.status(403).json({ 
          message: 'Accès refusé - Permissions insuffisantes',
          userRole: req.user.role,
          requiredRoles: allowedRoles
        });
      }

      next();
    } catch (error) {
      console.error('Erreur vérification rôle:', error);
      res.status(500).json({ message: 'Erreur lors de la vérification du rôle', error: error.message });
    }
  };
};

module.exports = checkRole;
