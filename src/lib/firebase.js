import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAbohXIGgKzjszGJysVV73DNhyvhha9dIY",
  authDomain: "cwa6143-push.firebaseapp.com",
  projectId: "cwa6143-push",
  storageBucket: "cwa6143-push.firebasestorage.app",
  messagingSenderId: "153507294385",
  appId: "1:153507294385:web:933ab0291f35a1a8d74690",
  measurementId: "G-2R6W5CFWBJ",
};

export const VAPID_KEY = "BLQKqLyrnfQe65T_N9owI4XrJiwFit9GKAoDXWZavviWjFzCwulRJ1SWQEa_NiVJg4-wUd4fbeSzA7V-WvZ95aM";

const app = initializeApp(firebaseConfig);

let messaging = null;
isSupported().then((ok) => {
  if (ok) messaging = getMessaging(app);
}).catch(() => {});

export { messaging };