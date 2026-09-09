import React, { useState, useEffect } from "react";
import { Share, X, Download } from "lucide-react";

const DISMISS_KEY = "cwa_ios_install_dismissed";

function isIOS() {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const isIPadOS = platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1;
  return /iPhone|iPad|iPod/.test(ua) || isIPadOS;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // iOS has no programmatic install API — only show the instructional banner
    // on iOS Safari, and never when already installed/standalone.
    if (!isIOS() || isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {}
    setShow(true);
  }, []);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
  };

  if (!show) return null;

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#c8102e]/10 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-[#c8102e]" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-slate-900">Add CWA 6143 to your Home Screen</h2>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Install the app for quick, full-screen access — it works just like a native app.
          </p>
          <ol className="mt-3 space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 shrink-0 rounded-full bg-[#c8102e]/10 flex items-center justify-center">
                <Share className="w-3 h-3 text-[#c8102e]" />
              </span>
              Tap the <span className="font-semibold text-slate-800">Share</span> button at the bottom of the screen.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 shrink-0 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">2</span>
              Scroll and tap <span className="font-semibold text-slate-800">Add to Home Screen</span>.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 shrink-0 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">3</span>
              Tap <span className="font-semibold text-slate-800">Add</span> — that&apos;s it.
            </li>
          </ol>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}