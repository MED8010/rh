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
      ...data
    });
    await notif.save();

    // 2. Envoi via Push (Service Worker) si configuré
    await sendPushNotification(userId, {
      title: data.titre,
      body: data.message,
      data: {
        url: '/notifications',
        reference_id: data.reference_id
      },
      icon: '/logo192.png', // Chemin vers l'icône par défaut
      badge: '/badge.png'
    });

    return notif;
  } catch (error) {
    console.error('❌ [NOTIF SERVICE ERROR]', error.message);
  }
};

module.exports = { createAndSendNotification };
