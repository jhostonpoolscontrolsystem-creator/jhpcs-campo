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
  
  const notificationTitle = payload.notification?.title || '🚨 JHPCS Campo • Alerta do Tratador';
  const notificationOptions = {
    body: payload.notification?.body || 'Atualização de roteiro de campo ou alerta de conformidade química.',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: payload.data || { url: '/' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
