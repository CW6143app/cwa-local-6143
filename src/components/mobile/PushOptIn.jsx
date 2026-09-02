import React, { useState } from "react";
import { Bell, BellRing, Loader2, CheckCircle2 } from "lucide-react";
import { requestNotificationPermission } from "@/lib/firebase";
import { base44 } from "@/api/base44Client";

export default function PushOptIn() {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [message, setMessage] = useState("");

  const handleOptIn = async () => {
    setStatus("loading");
    setMessage("");
    try {
      const token = await requestNotificationPermission();
      // Register the service worker for background messages
      if ("serviceWorker" in navigator) {
        try {
          await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        } catch (e) {
          console.warn("SW registration failed:", e);
        }
      }
      // Store the token so admins can send to subscribers
      await base44.entities.PushToken.create({
        token,
        user_agent: navigator.userAgent,
      });
      setStatus("done");
      setMessage("You're subscribed — thanks for enabling alerts.");
    } catch (err) {
      console.error("Push opt-in failed:", err);
      setStatus("error");
      setMessage(err.message || "Couldn't enable notifications. Try again later.");
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c8102e]">
        Local Alerts
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Get push notifications for urgent updates, meeting reminders, and action alerts from CWA Local 6143.
      </p>

      {status === "done" ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4" />
          {message}
        </div>
      ) : (
        <button
          onClick={handleOptIn}
          disabled={status === "loading"}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#c8102e] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a30d24] disabled:opacity-60"
        >
          {status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : status === "error" ? (
            <Bell className="w-4 h-4" />
          ) : (
            <BellRing className="w-4 h-4" />
          )}
          {status === "loading"
            ? "Enabling…"
            : status === "error"
            ? "Try again"
            : "Enable alerts"}
        </button>
      )}

      {status === "error" && (
        <p className="mt-2 text-xs text-red-600">{message}</p>
      )}
    </div>
  );
}