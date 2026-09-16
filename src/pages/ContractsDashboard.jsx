import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Shield, FileText, Trash2, Upload, Loader2, Plus } from "lucide-react";

export default function ContractsDashboard() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const fileInputRefs = useRef({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await base44.entities.Contract.list("sort_order", 100);
      setContracts(Array.isArray(data) ? data : []);
    } catch {
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await base44.entities.Contract.create({ title: newTitle.trim(), sort_order: contracts.length });
      setNewTitle("");
      await load();
    } finally {
      setCreating(false);
    }
  };

  const handleUpload = async (contractId, file) => {
    if (!file) return;
    setUploadingId(contractId);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      await base44.entities.Contract.update(contractId, { file_url });
      await load();
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this contract?")) return;
    try {
      await base44.entities.Contract.delete(id);
      await load();
    } catch {
      alert("Failed to delete. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 bg-[#0b2545] text-white px-5 py-4 shadow-md">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#ff8a9b]" />
              <h1 className="text-base font-bold">Contracts</h1>
            </div>
            <p className="text-[11px] text-white/50 mt-0.5">CWA Local 6143 — Admin View</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New contract title (e.g. 2025 Southwest Core Contract)"
            className="flex-1 h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#c8102e]"
          />
          <button
            type="submit"
            disabled={creating || !newTitle.trim()}
            className="h-10 shrink-0 flex items-center gap-1.5 rounded-lg bg-[#c8102e] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#c8102e]" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No contracts yet. Add one above.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
            {contracts.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#c8102e]/10 text-[#c8102e]">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                  <p className="text-xs text-slate-400 truncate">{c.file_url ? "File uploaded" : "No file uploaded yet"}</p>
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  ref={(el) => (fileInputRefs.current[c.id] = el)}
                  onChange={(e) => handleUpload(c.id, e.target.files?.[0])}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[c.id]?.click()}
                  disabled={uploadingId === c.id}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  {uploadingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {c.file_url ? "Replace" : "Upload"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}