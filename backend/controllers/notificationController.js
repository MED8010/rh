const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const webPush = require('web-push');

// Configuration Web Push (Générez vos clés VAPID une seule fois!)
// (Note: En production, mettez-les dans .env)
const vapidDetails = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BFZshl9-oV5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'VAPID_PRIVATE_KEY_MISSING',
  subject: 'mailto:admin@rh-med.com'
};

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    vapidDetails.subject,
    vapidDetails.publicKey,
    vapidDetails.privateKey
  );
}

// Obtenir toutes les notifications de l'utilisateur
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ date_creation: -1 });

    // Compter les non-lues
    const unreadCount = notifications.filter(n => !n.lu).length;

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération', error: error.message });
  }
};

// Marquer une notification comme lue
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      {
        lu: true,
        date_lecture: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour', error: error.message });
  }
};

// Marquer toutes les notifications comme lues
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, lu: false },
      {
        lu: true,
        date_lecture: new Date()
      }
    );

    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour', error: error.message });
  }
};

// Supprimer une notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
  }
};

// Supprimer toutes les notifications lues
const deleteAllReadNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({
      user: req.user.id,
      lu: true
    });

    res.json({ message: 'Notifications supprimées' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
  }
};

// S'abonner aux notifications push
const subscribeToPush = async (req, res) => {
  try {
    const { subscription, device_info } = req.body;
    
    // Supprimer l'ancien abonnement pour cet utilisateur/terminal s'il existe
    await PushSubscription.findOneAndDelete({ 
      user: req.user.id, 
      'subscription.endpoint': subscription.endpoint 
    });

    const newSub = new PushSubscription({
      user: req.user.id,
      subscription,
      device_info
    });

    await newSub.save();
    res.status(201).json({ message: 'Abonnement push enregistré' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur d’abonnement', error: error.message });
  }
};

// Fonction utilitaire pour envoyer un push à un utilisateur
const sendPushNotification = async (userId, payload) => {
  try {
    const subscriptions = await PushSubscription.find({ user: userId });
    
    const pushPromises = subscriptions.map(sub => 
      webPush.sendNotification(sub.subscription, JSON.stringify(payload))
        .catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // L'abonnement est expiré ou n'est plus valide -> le supprimer
            return PushSubscription.findByIdAndDelete(sub._id);
          }
          console.error('[PUSH ERROR]', err);
        })
    );

    await Promise.all(pushPromises);
  } catch (error) {
    console.error('[PUSH JOB ERROR]', error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllReadNotifications,
  subscribeToPush,
  sendPushNotification
};
