const Notification = require('../models/Notification');
const { sendPushNotification } = require('../controllers/notificationController');

/**
 * Service centralisé pour la création et l'envoi de notifications
 * @param {ObjectId} userId - ID de l'utilisateur destinataire
 * @param {Object} data - { type, category, titre, message, reference_id }
 */
const createAndSendNotification = async (userId, data) => {
  try {
    // 1. Sauvegarde en Base de Données
    const notif = new Notification({
      user: userId,
      type: data.type,
      category: data.category || 'General',
      titre: data.titre,
      message: data.message,
      reference_id: data.reference_id
    });
    await notif.save();

    console.log(`📡 Notification sauvegardée pour ${userId}: ${data.titre}`);

    // 2. Envoi via Push (Service Worker) si configuré
    try {
      await sendPushNotification(userId, {
        title: data.titre,
        body: data.message,
        data: {
          url: '/notifications',
          reference_id: data.reference_id
        },
        icon: '/logo192.png',
        badge: '/badge.png'
      });
    } catch (pushErr) {
      console.warn('⚠️ Échec de l\'envoi Push:', pushErr.message);
    }

    return notif;
  } catch (error) {
    console.error('❌ [NOTIF SERVICE ERROR]', error.message);
  }
};

/**
 * Version simplifiée pour les appels directs dans les contrôleurs
 */
const createNotification = async (userId, type, titre, message, reference_id) => {
  return createAndSendNotification(userId, {
    type,
    titre,
    message,
    reference_id
  });
};

module.exports = { 
  createAndSendNotification,
  createNotification 
};
