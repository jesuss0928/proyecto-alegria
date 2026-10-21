// Importamos las herramientas de Firebase para el vigilante en segundo plano
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Pega aquí la misma configuración que tienes en tu firebase.js
firebase.initializeApp({
  apiKey: "TU_API_KEY",
  authDomain: "alegria-web-977ea.firebaseapp.com",
  projectId: "alegria-web-977ea",
  storageBucket: "alegria-web-977ea.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
});

const messaging = firebase.messaging();

// Esta función es la que hace sonar el celular cuando la app está cerrada
messaging.onBackgroundMessage((payload) => {
  console.log('¡Mensaje recibido con la app cerrada!', payload);
  
  const notificationTitle = payload.notification.title || 'Proyecto Alegría';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icono-app.png', // El ícono de tu app
    badge: '/icono-app.png',
    requireInteraction: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
