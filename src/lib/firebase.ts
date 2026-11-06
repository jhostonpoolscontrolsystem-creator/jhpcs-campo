import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    // Configuração pendente das chaves no .env
    return null;
  }

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return app;
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  const fApp = getFirebaseApp();
  if (!fApp) return null;

  try {
    if (!messaging && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      messaging = getMessaging(fApp);
    }
  } catch (err) {
    console.warn('Firebase Messaging não suportado neste navegador:', err);
  }
  return messaging;
}

/**
 * Solicita permissão do navegador para notificações Push (FCM)
 * e retorna o token de registro para vincular ao usuário
 */
export async function requestNotificationPermission(vapidKey?: string): Promise<string | null> {
  try {
    const fMessaging = getFirebaseMessaging();
    if (!fMessaging) {
      console.warn('Firebase Messaging não inicializado. Verifique as credenciais no .env.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(fMessaging, {
        vapidKey: vapidKey || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      return token;
    } else {
      console.warn('Permissão de notificação negada pelo usuário.');
      return null;
    }
  } catch (error) {
    console.error('Erro ao obter token FCM:', error);
    return null;
  }
}

/**
 * Escuta notificações recebidas em primeiro plano (Foreground Push)
 */
export function onMessageListener(callback: (payload: any) => void) {
  const fMessaging = getFirebaseMessaging();
  if (!fMessaging) return () => {};

  return onMessage(fMessaging, (payload) => {
    callback(payload);
  });
}
