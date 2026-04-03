import apiClient from './api';

const VAPID_PUBLIC_KEY = 'BFZshl9-oV5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T5T';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Service pour l'inscription aux notifications Push du navigateur
 */
export const subscribeUserToPush = async () => {
  try {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers non supportés');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Demande de permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permission Push refusée');
      return;
    }

    // Inscription au Push Manager
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    };

    const subscription = await registration.pushManager.subscribe(subscribeOptions);
    
    // Envoi de l'abonnement au backend
    await apiClient.post('/notifications/subscribe', {
      subscription,
      device_info: {
        browser: navigator.userAgent,
        platform: navigator.platform
      }
    });

    console.log('✅ Inscription Push réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur inscription Push:', error);
    return false;
  }
};
