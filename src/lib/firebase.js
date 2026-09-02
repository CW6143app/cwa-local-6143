import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAbohXIGgKzjszGJysVV73DNhyvhha9dIY",
  authDomain: "cwa6143-push.firebaseapp.com",
  projectId: "cwa6143-push",
  storageBucket: "cwa6143-push.firebasestorage.app",
  messagingSenderId: "153507294385",
  appId: "1:153507294385:web:933ab0291f35a1a8d74690",
  measurementId: "G-2R6W5CFWBJ",
};

// Web push VAPID key — generate in Firebase Console:
// Project Settings → Cloud Messaging → Web configuration → Generate key pair
export const VAPID_KEY = "PASTE_VAPID_KEY_HERE";

const app = initializeApp(firebaseConfig);
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  // Messaging unsupported in this browser/environment
  console.warn("Firebase messaging unavailable:", e);
}

export { messaging };

export async function requestNotificationPermission() {
  if (!messaging) throw new Error("Messaging not supported in this browser.");
  if (!("Notification" in window)) throw new Error("Notifications not supported.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission denied.");
  const token = await getToken(messaging, { vapidKey: VAPID_KEY });
  return token;
}

export function onMessageListener(callback) {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}