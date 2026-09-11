import React, { useState, useEffect } from "react";
import { Bell, BellRing, Loader2, CheckCircle2 } from "lucide-react";
import { messaging, VAPID_KEY } from "@/lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import {
  isNativeApp,
  currentPlatform,
  nativePushIsGranted,
  registerNativePush,
  listenNativePush,
} from "@/lib/nativePush";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

// Best-effort save — a device may already have a row (duplicate is fine to
// ignore), and this should never block the UI from reflecting "granted".
async function savePushToken(token) {
  try {
    await base44.entities.PushToken.create({
      token,
      user_agent: navigator.userAgent || "",
      platform: currentPlatform(), // "web" | "ios" | "android"
    });
  } catch (e) {
    // token may already exist — ignore duplicate
  }
}

export default function PushOptIn() {
  const [status, setStatus] = useState("idle"); // idle | loading | granted | denied | unsupported
  const { toast } = useToast();
  const native = isNativeApp();

  useEffect(() => {
    let unsubWeb;
    let unlistenNative;
    let cancelled = false;

    const setupNative = async () => {
      try {
        const granted = await nativePushIsGranted();
        if (!granted) return;
        if (cancelled) return;
        setStatus("granted");
        // Re-fetch the token so PushToken stays fresh even if it rotated
        // since the last launch (covered by the duplicate-ignore above).
        const { token } = await registerNativePush();
        if (token) await savePushToken(token);
        unlistenNative = await listenNativePush({
          onTap: (url) => {
            window.location.href = url;
          },
        });
      } catch (e) {
        // ignore — user can retry via the Enable button
      }
    };

    const setupWeb = () => {
      // If permission was already granted, make sure the SW + token are set
      // up (covers users who opted in before the service worker existed).
      const ensureRegistered = async () => {
        if (!("Notification" in window) || Notification.permission !== "granted" || !messaging) return;
        try {
          const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
          const tok = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: swReg,
          });
          await savePushToken(tok);
        } catch (e) {
          // ignore — token may already exist or SW unavailable
        }
      };

      if ("Notification" in window && Notification.permission === "granted") {
        setStatus("granted");
        ensureRegistered();
      }

      // Route foreground pushes through the OS's native notification system —
      // the same showNotification() call the service worker uses in the
      // background — so an alert looks and behaves identically whether the
      // app is open or closed, instead of a custom in-app toast.
      if (messaging) {
        unsubWeb = onMessage(messaging, async (payload) => {
          const d = payload.data || {};
          const title = d.title || "CWA Local 6143";
          const body = d.body || "";
          const url = d.url || "https://cwa6143.base44.app/events";

          // Fire only one native notification, even if the app is open in
          // multiple tabs of the same browser.
          const key = `${title}|${body}`;
          const now = Date.now();
          try {
            const stored = JSON.parse(localStorage.getItem("cwa_last_push") || "{}");
            if (stored.key === key && now - stored.time < 5000) return;
            localStorage.setItem("cwa_last_push", JSON.stringify({ key, time: now }));
          } catch (e) {
            // ignore storage errors
          }

          try {
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification(title, {
              body,
              icon: "https://media.base44.com/images/public/6a96f9a8ac8dfadbcb9d319b/be7f61f04_CWA6143a.jpg",
              data: { url },
            });
          } catch (e) {
            // No active service worker registration — fall back to an
            // in-app toast so the alert still reaches the user.
            toast({ title, description: body });
          }
        });
      }
    };

    if (native) {
      setupNative();
    } else {
      setupWeb();
    }

    return () => {
      cancelled = true;
      if (unsubWeb) unsubWeb();
      if (unlistenNative) unlistenNative();
    };
  }, [native]);

  const enableNative = async () => {
    setStatus("loading");
    try {
      const { granted, token } = await registerNativePush();
      if (!granted) {
        setStatus("denied");
        return;
      }
      await savePushToken(token);
      const unlisten = await listenNativePush({
        onTap: (url) => {
          window.location.href = url;
        },
      });
      // Keep the listener alive for the life of the component; there's no
      // extra cleanup needed beyond the effect's own unmount handling above,
      // since this only runs once per opt-in click.
      void unlisten;
      setStatus("granted");
    } catch (err) {
      console.error("Native push opt-in failed:", err);
      setStatus("denied");
    }
  };

  const enableWeb = async () => {
    if (!("Notification" in window)) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      if (!messaging) {
        setStatus("unsupported");
        return;
      }
      const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const tok = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });
      await savePushToken(tok);
      setStatus("granted");
    } catch (err) {
      console.error("Push opt-in failed:", err);
      setStatus("denied");
    }
  };

  const enable = native ? enableNative : enableWeb;

  if (status === "granted") return null;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c8102e]">
        Local Alerts
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Get notified on this device when the Local posts urgent updates, meeting changes, or mobilization alerts.
      </p>

      <div className="mt-4">
        {status === "granted" ? (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            Notifications enabled for this device
          </div>
        ) : status === "denied" ? (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <Bell className="w-4 h-4" />
            {native
              ? "Notifications blocked — enable them in your device's Settings for this app."
              : "Notifications blocked — enable them in your browser settings."}
          </div>
        ) : status === "unsupported" ? (
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
            <Bell className="w-4 h-4" />
            Push notifications aren't supported on this browser.
          </div>
        ) : (
          <button
            onClick={enable}
            disabled={status === "loading"}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-4 py-3 text-sm font-semibold text-white hover:bg-[#a50d24] disabled:opacity-60 transition-colors"
          >
            {status === "loading" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <BellRing className="w-4 h-4" />
            )}
            Enable notifications
          </button>
        )}
      </div>
    </div>
  );
}
