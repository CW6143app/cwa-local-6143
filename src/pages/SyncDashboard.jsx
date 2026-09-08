import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Shield, RefreshCw, CheckCircle2, AlertTriangle, FileText, CalendarDays, Video, Smartphone } from "lucide-react";

const ZOOM_URL = "https://us02web.zoom.us/j/86358644306?pwd=VVRinTQCDLhCTM4SS3oXbXR93lgCva.1";

export default function SyncDashboard() {
  const [stories, setStories] = useState([]);
  const [events, setEvents] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [s, e, t] = await Promise.all([
        base44.entities.SyncedStory.list("sort_order", 50),
        base44.entities.SyncedEvent.list("sort_order", 50),
        base44.entities.PushToken.list("-created_date", 100),
      ]);
      setStories(Array.isArray(s) ? s : []);
      setEvents(Array.isArray(e) ? e : []);
      setTokens(Array.isArray(t) ? t : []);
    } catch {
      // ignore — empty state is fine
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const lastSync = stories[0]?.updated_date || events[0]?.updated_date;

  const [pushMsg, setPushMsg] = useState("");

  const toggleJoin = async (e) => {
    const turningOn = !e.join_meeting_url;
    try {
      await base44.entities.SyncedEvent.update(e.id, {
        join_meeting_url: turningOn ? ZOOM_URL : "",
      });
      await load();
      setPushMsg(
        turningOn
          ? "Meeting link enabled — members will be notified automatically."
          : ""
      );
    } catch {
      // ignore — list refresh keeps stale state
    }
  };

  const handleSync = async () => {
    setError("");
    setResult(null);
    setSyncing(true);
    try {
      const res = await base44.functions.invoke("syncFromWebsite", {});
      setResult(res.data);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 bg-[#0b2545] text-white px-5 py-4 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#ff8a9b]" />
              <h1 className="text-base font-bold">Website Sync</h1>
            </div>
            <p className="text-[11px] text-white/50 mt-0.5">CWA Local 6143 — Admin View</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Join Meeting toggle */}
        <div className="rounded-2xl border-2 border-[#c8102e]/30 bg-white p-5">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[#c8102e]" />
            <h3 className="text-sm font-bold text-slate-900">Join Meeting Button</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Toggle the "Join Meeting" button on or off for each event. When on, members see the button on the home and events screens, and a push notification is sent to all opted-in devices.
          </p>
          {pushMsg && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {pushMsg}
            </div>
          )}
          {loading ? (
            <p className="mt-4 text-xs text-slate-400">Loading events…</p>
          ) : events.length === 0 ? (
            <p className="mt-4 text-xs text-slate-400">
              No events yet. Use "Sync now" below to pull events from cwa6143.org, then toggle the button here.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {events.map((e) => (
                <li key={e.id} className="flex items-center gap-3 text-sm">
                  <span className="w-12 shrink-0 text-center rounded-md bg-slate-100 py-1 text-xs font-bold text-slate-700">
                    {e.month} {e.day}
                  </span>
                  <span className="text-slate-700 truncate flex-1">{e.title}</span>
                  <button
                    onClick={() => toggleJoin(e)}
                    className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      e.join_meeting_url
                        ? "bg-[#c8102e] text-white hover:bg-[#a50d24]"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    {e.join_meeting_url ? "On" : "Off"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sync card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#c8102e]/10 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-[#c8102e]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-slate-900">Update app from website</h2>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                Pulls the latest Featured Stories and Upcoming Events from cwa6143.org and
                refreshes the app's Home and Events screens.
              </p>
              {lastSync && (
                <p className="mt-2 text-xs text-slate-400">
                  Last synced {new Date(lastSync).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="mt-5 w-full h-12 rounded-xl bg-[#c8102e] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#c8102e]/90 disabled:opacity-60 transition-colors"
          >
            {syncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Syncing from cwa6143.org…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sync now
              </>
            )}
          </button>

          {result && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4" />
              Synced {result.stories} stories and {result.events} events.
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Current content counts */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 leading-none">
                {loading ? "—" : stories.length}
              </p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">Stories</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-100 text-amber-600">
              <CalendarDays className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 leading-none">
                {loading ? "—" : events.length}
              </p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">Events</p>
            </div>
          </div>
        </div>

        {/* Push opt-ins */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#c8102e]" />
            <h3 className="text-sm font-bold text-slate-900">Push opt-ins</h3>
            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {loading ? "—" : tokens.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Devices that opted in to receive CWA Local 6143 push notifications.
          </p>
          {loading ? (
            <p className="mt-4 text-xs text-slate-400">Loading devices…</p>
          ) : tokens.length === 0 ? (
            <p className="mt-4 text-xs text-slate-400">
              No devices have opted in yet. Members can enable notifications from the Home screen.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {tokens.map((t) => {
                const ua = t.user_agent || "";
                const isIOS = /iPhone|iPad|iPod/i.test(ua);
                const isAndroid = /Android/i.test(ua);
                const browser = /Chrome/i.test(ua) ? "Chrome"
                  : /Safari/i.test(ua) ? "Safari"
                  : /Firefox/i.test(ua) ? "Firefox"
                  : /Edge/i.test(ua) ? "Edge"
                  : "Browser";
                const label = isIOS ? `iOS · ${browser}`
                  : isAndroid ? `Android · ${browser}`
                  : browser;
                return (
                  <li key={t.id} className="flex items-center gap-3 py-2.5 text-xs">
                    <span className="w-7 h-7 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      <Smartphone className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-700 truncate">{label}</p>
                      <p className="text-slate-400 truncate">
                        {t.token ? `…${t.token.slice(-8)}` : "no token"}
                      </p>
                    </div>
                    <span className="shrink-0 text-slate-400">
                      {t.created_date ? new Date(t.created_date).toLocaleDateString() : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}