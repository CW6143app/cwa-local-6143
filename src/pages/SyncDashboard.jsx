import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Shield, RefreshCw, CheckCircle2, AlertTriangle, FileText, CalendarDays } from "lucide-react";

export default function SyncDashboard() {
  const [stories, setStories] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [s, e] = await Promise.all([
        base44.entities.SyncedStory.list("sort_order", 50),
        base44.entities.SyncedEvent.list("sort_order", 50),
      ]);
      setStories(Array.isArray(s) ? s : []);
      setEvents(Array.isArray(e) ? e : []);
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

        {/* Preview of synced events */}
        {!loading && events.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current synced events</h3>
            <ul className="mt-3 space-y-2">
              {events.map((e) => (
                <li key={e.id} className="flex items-center gap-3 text-sm">
                  <span className="w-12 shrink-0 text-center rounded-md bg-slate-100 py-1 text-xs font-bold text-slate-700">
                    {e.month} {e.day}
                  </span>
                  <span className="text-slate-700 truncate">{e.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}