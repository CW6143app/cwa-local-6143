// Firebase Cloud Messaging service worker — handles background push notifications.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getMessaging,
  onBackgroundMessage,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-sw.js";

const firebaseConfig = {
  apiKey: "AIzaSyAbohXIGgKzjszGJysVV73DNhyvhha9dIY",
  authDomain: "cwa6143-push.firebaseapp.com",
  projectId: "cwa6143-push",
  storageBucket: "cwa6143-push.firebasestorage.app",
  messagingSenderId: "153507294385",
  appId: "1:153507294385:web:933ab0291f35a1a8d74690",
  measurementId: "G-2R6W5CFWBJ",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Data-only messages
onBackgroundMessage(messaging, (payload) => {
  const n = payload.notification || payload.data || {};
  const title = n.title || "CWA Local 6143";
  self.registration.showNotification(title, {
    body: n.body || "",
    icon: "https://media.base44.com/images/public/6a96f9a8ac8dfadbcb9d319b/be7f61f04_CWA6143a.jpg",
    badge: "https://media.base44.com/images/public/6a96f9a8ac8dfadbcb9d319b/be7f61f04_CWA6143a.jpg",
    data: (payload.data || {}) ,
  });
});

// Notification-payload messages: ensure they always display
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    try {
      payload = { notification: { body: event.data ? event.data.text() : "" } };
    } catch (e2) {
      payload = {};
    }
  }
  const n = payload.notification || {};
  const title = n.title || "CWA Local 6143";
  const options = {
    body: n.body || "",
    icon: "https://media.base44.com/images/public/6a96f9a8ac8dfadbcb9d319b/be7f61f04_CWA6143a.jpg",
    badge: "https://media.base44.com/images/public/6a96f9a8ac8dfadbcb9d319b/be7f61f04_CWA6143a.jpg",
    data: payload.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow("/");
      })
  );
});
