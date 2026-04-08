/**
 * Middleware d'authentification par clé API
 * Utilisé pour l'accès Machine-to-Machine (M2M) à l'API d'export
 */
const apiKeyAuth = (req, res, next) => {
  try {
    // Récupérer la clé API depuis les headers
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey) {
      return res.status(401).json({ message: 'Clé API manquante' });
    }

    // Vérifier la clé API contre les clés valides
    const validApiKeys = (process.env.API_KEYS || '').split(',').filter(key => key.trim());
    
    if (!validApiKeys.includes(apiKey.trim())) {
      console.warn(`⛔ Accès refusé: Clé API invalide depuis ${req.ip}`);
      return res.status(403).json({ message: 'Clé API invalide' });
    }

    // Clé valide, continuer
    req.apiKey = apiKey;
    next();
  } catch (error) {
    console.error('Erreur authentification clé API:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification de la clé API', error: error.message });
  }
};

module.exports = apiKeyAuth;
