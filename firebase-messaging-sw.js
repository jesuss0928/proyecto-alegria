// Importamos las herramientas de Firebase para el vigilante en segundo plano
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Tu configuración exacta
firebase.initializeApp({
    apiKey: "AIzaSyCXRaqSetEKHEn3-AIhK3XalDEPJ8vhUfE",
    authDomain: "alegria-web-977ea.firebaseapp.com",
    projectId: "alegria-web-977ea",
    storageBucket: "alegria-web-977ea.firebasestorage.app",
    messagingSenderId: "561418892075",
    appId: "1:561418892075:web:133a1ff3948b86a4e88b6e"
});

const messaging = firebase.messaging();

// Esta función es la que hace sonar el celular cuando la app está cerrada
messaging.onBackgroundMessage((payload) => {
  console.log('¡Mensaje recibido con la app cerrada!', payload);
  
  const notificationTitle = payload.notification.title || 'Proyecto Alegría';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icono-app.png',
    badge: '/icono-app.png',
    requireInteraction: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
