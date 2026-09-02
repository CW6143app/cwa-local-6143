importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAbohXIGgKzjszGJysVV73DNhyvhha9dIY",
  authDomain: "cwa6143-push.firebaseapp.com",
  projectId: "cwa6143-push",
  storageBucket: "cwa6143-push.firebasestorage.app",
  messagingSenderId: "153507294385",
  appId: "1:153507294385:web:933ab0291f35a1a8d74690",
  measurementId: "G-2R6W5CFWBJ",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "CWA Local 6143", {
    body: body || "",
    icon: "/icons/icon-192.png",
  });
});
