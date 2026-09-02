import React, { useState, useEffect } from "react";
import { Bell, BellRing, Loader2, CheckCircle2 } from "lucide-react";
import { messaging, VAPID_KEY } from "@/lib/firebase";
import { getToken } from "firebase/messaging";

export default function PushOptIn() {
  const [status, setStatus] = useState("idle"); // idle | loading | granted | denied | unsupported
  const [token, setToken] = useState(null);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setStatus("granted");
    }
  }, []);

  const enable = async () => {
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
      setToken(tok);
      setStatus("granted");
    } catch (err) {
      console.error("Push opt-in failed:", err);
      setStatus("denied");
    }
  };

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
            Notifications blocked — enable them in your browser settings.
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