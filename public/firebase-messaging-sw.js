importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

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

// Data-only messages: show exactly one notification in the background.
messaging.onBackgroundMessage((payload) => {
  const d = payload.data || {};
  const title = d.title || "CWA Local 6143";
  const body = d.body || "";
  const url = d.url || "https://cwa6143.base44.app/events";
  return self.registration.showNotification(title, {
    body,
    icon: "https://media.base44.com/images/public/6a96f9a8ac8dfadbcb9d319b/be7f61f04_CWA6143a.jpg",
    data: { url },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "https://cwa6143.base44.app/events";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if ("focus" in c) {
          c.focus();
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })()
  );
});
