import { Capacitor } from "@capacitor/core";

// True only inside the Capacitor-wrapped iOS/Android app (App Store / Play
// Store build). False in a regular browser tab or an installed PWA, where
// the existing firebase.js web-push flow is used instead.
export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

// "ios" | "android" | "web" — stored on PushToken so admins can see the
// breakdown by platform. Delivery itself doesn't branch on this: iOS and
// Android both hand back an FCM registration token via the native Firebase
// SDKs, so the existing sendMeetingPush backend (FCM HTTP v1) sends to all
// three platforms the exact same way.
export function currentPlatform() {
  return Capacitor.getPlatform();
}

// Checks current permission status without prompting. Mirrors
// `Notification.permission === "granted"` on the web side.
export async function nativePushIsGranted() {
  const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
  const { receive } = await FirebaseMessaging.checkPermissions();
  return receive === "granted";
}

// Requests permission (if needed) and returns the FCM token for this device.
export async function registerNativePush() {
  const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");

  let { receive } = await FirebaseMessaging.checkPermissions();
  if (receive !== "granted") {
    ({ receive } = await FirebaseMessaging.requestPermissions());
  }
  if (receive !== "granted") {
    return { granted: false, token: null };
  }

  const { token } = await FirebaseMessaging.getToken();
  return { granted: true, token };
}

// Native foreground pushes aren't auto-shown by the OS (same gap the web app
// has) — schedule a local notification immediately so it lands in the system
// tray the same way a background/killed-app push would.
// Returns a cleanup function to remove the listeners.
export async function listenNativePush({ onTap } = {}) {
  const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
  const { LocalNotifications } = await import("@capacitor/local-notifications");

  await LocalNotifications.requestPermissions().catch(() => {});

  const received = await FirebaseMessaging.addListener("notificationReceived", async (event) => {
    const n = event.notification || {};
    const title = n.title || "CWA Local 6143";
    const body = n.body || "";
    const url = (n.data && n.data.url) || "https://cwa6143.base44.app/events";

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() % 2147483647,
            title,
            body,
            extra: { url },
          },
        ],
      });
    } catch (e) {
      // If local notifications aren't available, the push still arrives via
      // the OS whenever the app isn't in the foreground — nothing else to do.
    }
  });

  const tapped = await FirebaseMessaging.addListener("notificationActionPerformed", (event) => {
    const url =
      (event.notification && event.notification.data && event.notification.data.url) ||
      "https://cwa6143.base44.app/events";
    onTap && onTap(url);
  });

  const localTapped = await LocalNotifications.addListener(
    "localNotificationActionPerformed",
    (event) => {
      const url = event.notification?.extra?.url || "https://cwa6143.base44.app/events";
      onTap && onTap(url);
    }
  );

  return () => {
    received.remove();
    tapped.remove();
    localTapped.remove();
  };
}
