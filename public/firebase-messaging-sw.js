importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAuUUoLkZVNMnRVBhRpuq1zEld3dSx8-K8",
  authDomain: "jhpcs-2fefd.firebaseapp.com",
  projectId: "jhpcs-2fefd",
  storageBucket: "jhpcs-2fefd.firebasestorage.app",
  messagingSenderId: "92701227950",
  appId: "1:92701227950:web:13aa16cf5631582e4ae63f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Notificação recebida em background:', payload);
  
  const notificationTitle = payload.notification?.title || '🚨 JHoston Pools - Alerta de Auditoria';
  const notificationOptions = {
    body: payload.notification?.body || 'Nova notificação de conformidade química.',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
