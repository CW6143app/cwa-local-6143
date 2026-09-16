import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Download, Loader2, Users, ChevronDown, ChevronUp, Pencil, Trash2, Plus, FileSpreadsheet } from "lucide-react";
import EditRosterMember from "@/components/admin/EditRosterMember";
import BulkEditBar from "@/components/admin/BulkEditBar";
import RosterCrossReference from "@/components/admin/RosterCrossReference";

const CSV_COLUMNS = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "ncs_date", label: "NCS Date" },
  { key: "vp_group", label: "VP Group" },
  { key: "status", label: "Status" },
  { key: "processing_unit", label: "Processing Unit" },
  { key: "building_city", label: "Building City" },
  { key: "notes", label: "Notes" }
];

function escapeCsv(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildCsv(rows) {
  const header = CSV_COLUMNS.map((c) => escapeCsv(c.label)).join(",");
  const body = rows
    .map((r) => CSV_COLUMNS.map((c) => escapeCsv(c.key === "processing_unit" ? stripProcessingUnitNumber(r[c.key]) : r[c.key])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

function downloadCsv(filename, rows) {
  const csv = buildCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function stripProcessingUnitNumber(value) {
  if (!value) return "";
  return String(value).replace(/^\s*\d+\s*/, "").trim();
}

function safeJobTitleSlug(title) {
  return (title || "untitled")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "untitled";
}

export default function RosterByJobTitle() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedVp, setExpandedVp] = useState({});
  const [expandedJt, setExpandedJt] = useState({});
  const [showCompare, setShowCompare] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await base44.entities.RosterMember.list("ncs_date", 1000);
        setMembers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load roster:", err);
        setError("Unable to load roster. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Top-level folders by VP Group; inside each, sub-folders by job_title
  const vpGroups = useMemo(() => {
    const vpMap = new Map();
    for (const m of members) {
      const vpKey = m.vp_group ? `VP ${m.vp_group}` : "Unassigned";
      if (!vpMap.has(vpKey)) vpMap.set(vpKey, []);
      vpMap.get(vpKey).push(m);
    }
    const arr = Array.from(vpMap.entries()).map(([vpTitle, rows]) => {
      const jtMap = new Map();
      for (const r of rows) {
        const jt = r.job_title || "(No Job Title)";
        if (!jtMap.has(jt)) jtMap.set(jt, []);
        jtMap.get(jt).push(r);
      }
      const jobGroups = Array.from(jtMap.entries()).map(([title, jtRows]) => ({
        title,
        rows: jtRows.slice().sort((a, b) => {
          const da = a.ncs_date || "";
          const db = b.ncs_date || "";
          return da < db ? -1 : da > db ? 1 : 0;
        })
      })).sort((a, b) => a.title.localeCompare(b.title));
      return { vpTitle, rows, jobGroups };
    });
    arr.sort((a, b) => {
      if (a.vpTitle === "Unassigned") return 1;
      if (b.vpTitle === "Unassigned") return -1;
      return a.vpTitle.localeCompare(b.vpTitle, undefined, { numeric: true });
    });
    return arr;
  }, [members]);

  const toggleVp = (vpTitle) => setExpandedVp((p) => ({ ...p, [vpTitle]: !p[vpTitle] }));
  const toggleJt = (key) => setExpandedJt((p) => ({ ...p, [key]: !p[key] }));

  const openEdit = (member) => {
    setEditing(member);
    setEditOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setEditOpen(true);
  };

  const handleSave = async (id, payload) => {
    if (id) {
      const updated = await base44.entities.RosterMember.update(id, payload);
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...payload } : m)));
      return updated;
    } else {
      const created = await base44.entities.RosterMember.create({
        first_name: payload.first_name || "",
        last_name: payload.last_name || "",
        ...payload
      });
      setMembers((prev) => [...prev, created]);
      return created;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this roster member? This cannot be undone.")) return;
    try {
      await base44.entities.RosterMember.delete(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert("Could not delete: " + (err.message || "unknown error"));
    }
  };

  const downloadAll = () => {
    vpGroups.forEach((g) => downloadCsv(`roster_${safeJobTitleSlug(g.vpTitle)}.csv`, g.rows));
  };

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroupSelected = (rows) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = rows.every((r) => next.has(r.id));
      if (allSelected) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const clearSelected = () => setSelected(new Set());

  const selectAll = () => {
    if (selected.size === members.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(members.map((m) => m.id)));
    }
  };

  const handleBulkApply = async (field, value) => {
    const ids = Array.from(selected);
    const payload = ids.map((id) => ({ id, [field]: value }));
    await base44.entities.RosterMember.bulkUpdate(payload);
    setMembers((prev) =>
      prev.map((m) => (selected.has(m.id) ? { ...m, [field]: value } : m))
    );
    setSelected(new Set());
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 bg-[#0b2545] text-white px-5 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#ff8a9b]" />
                <h1 className="text-base font-bold">VP Group Roster</h1>
              </div>
              <p className="text-[11px] text-white/50 mt-0.5">CWA Local 6143 — Admin View</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && vpGroups.length > 0 && (
              <button
                onClick={downloadAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c8102e] text-white text-xs font-semibold hover:bg-[#c8102e]/90 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download All
              </button>
            )}
            {!loading && members.length > 0 && (
              <button
                onClick={() => setShowCompare((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${showCompare ? "bg-white/20 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Compare CSV
              </button>
            )}
            {!loading && (
              <button
                onClick={openNew}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Member
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6" style={{ paddingBottom: selected.size > 0 ? "5rem" : "1.5rem" }}>
        {showCompare && !loading && <RosterCrossReference members={members} onClose={() => setShowCompare(false)} />}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#c8102e]" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && vpGroups.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="mt-3 text-sm font-medium text-slate-500">No roster members found.</p>
          </div>
        )}

        {!loading && !error && vpGroups.length > 0 && (
          <>
            <p className="text-xs text-slate-500 mb-4">
              {vpGroups.length} VP group{vpGroups.length === 1 ? "" : "s"} · {members.length} total members · sorted by NCS date (oldest → newest)
            </p>
            <div className="space-y-3">
              {vpGroups.map((g) => {
                const vpOpen = expandedVp[g.vpTitle] !== false;
                return (
                  <div key={g.vpTitle} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-[#0b2545]/5">
                      <button
                        onClick={() => toggleVp(g.vpTitle)}
                        className="flex items-center gap-2 text-left min-w-0"
                      >
                        {vpOpen ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                        <Users className="w-4 h-4 text-[#0b2545] shrink-0" />
                        <span className="font-bold text-[#0b2545] truncate">{g.vpTitle}</span>
                        <span className="text-xs font-medium text-slate-400 shrink-0">({g.rows.length})</span>
                      </button>
                      <button
                        onClick={() => downloadCsv(`roster_${safeJobTitleSlug(g.vpTitle)}.csv`, g.rows)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c8102e] text-white text-xs font-semibold hover:bg-[#c8102e]/90 transition-colors shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" /> CSV
                      </button>
                    </div>

                    {vpOpen && (
                      <div className="border-t border-slate-100 divide-y divide-slate-100">
                        {g.jobGroups.map((jg) => {
                          const jtKey = `${g.vpTitle}::${jg.title}`;
                          const jtOpen = expandedJt[jtKey] !== false;
                          return (
                            <div key={jtKey} className="bg-white">
                              <div className="flex items-center justify-between px-4 py-3 bg-slate-50/60">
                                <button
                                  onClick={() => toggleJt(jtKey)}
                                  className="flex items-center gap-2 text-left min-w-0"
                                >
                                  {jtOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                                  <span className="font-semibold text-slate-800 truncate text-sm">{jg.title}</span>
                                  <span className="text-xs font-medium text-slate-400 shrink-0">({jg.rows.length})</span>
                                </button>
                                <button
                                  onClick={() => downloadCsv(`roster_${safeJobTitleSlug(g.vpTitle)}_${safeJobTitleSlug(jg.title)}.csv`, jg.rows)}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 text-[#0b2545] text-xs font-medium hover:bg-black/10 transition-colors shrink-0"
                                >
                                  <Download className="w-3 h-3" /> CSV
                                </button>
                              </div>

                              {jtOpen && (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                      <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                                        <th className="px-4 py-2 font-semibold w-10">
                                          <input
                                            type="checkbox"
                                            checked={jg.rows.length > 0 && jg.rows.every((r) => selected.has(r.id))}
                                            onChange={() => toggleGroupSelected(jg.rows)}
                                            className="accent-[#c8102e] w-4 h-4"
                                          />
                                        </th>
                                        <th className="px-4 py-2 font-semibold">First Name</th>
                                        <th className="px-4 py-2 font-semibold">Last Name</th>
                                        <th className="px-4 py-2 font-semibold">NCS Date</th>
                                        <th className="px-4 py-2 font-semibold">Status</th>
                                        <th className="px-4 py-2 font-semibold">Processing Unit</th>
                                        <th className="px-4 py-2 font-semibold">City</th>
                                        <th className="px-4 py-2 font-semibold text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {jg.rows.map((m) => (
                                        <tr key={m.id} className={`transition-colors ${selected.has(m.id) ? "bg-[#c8102e]/5" : "hover:bg-slate-50"}`}>
                                          <td className="px-4 py-2">
                                            <input
                                              type="checkbox"
                                              checked={selected.has(m.id)}
                                              onChange={() => toggleSelected(m.id)}
                                              className="accent-[#c8102e] w-4 h-4"
                                            />
                                          </td>
                                          <td className="px-4 py-2 text-slate-900">{m.first_name || "—"}</td>
                                          <td className="px-4 py-2 text-slate-900">{m.last_name || "—"}</td>
                                          <td className="px-4 py-2 text-slate-600">{m.ncs_date || "—"}</td>
                                          <td className="px-4 py-2 text-slate-600">{m.status || "—"}</td>
                                          <td className="px-4 py-2 text-slate-600 truncate max-w-[220px]" title={stripProcessingUnitNumber(m.processing_unit)}>{stripProcessingUnitNumber(m.processing_unit) || "—"}</td>
                                          <td className="px-4 py-2 text-slate-600">{m.building_city || "—"}</td>
                                          <td className="px-4 py-2 text-right whitespace-nowrap">
                                            <button
                                              onClick={() => openEdit(m)}
                                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/5 text-[#0b2545] hover:bg-black/10 transition-colors"
                                              aria-label="Edit member"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => handleDelete(m.id)}
                                              className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#c8102e]/10 text-[#c8102e] hover:bg-[#c8102e]/20 transition-colors"
                                              aria-label="Delete member"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <EditRosterMember
        open={editOpen}
        member={editing}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      <BulkEditBar
        selectedCount={selected.size}
        total={members.length}
        onApply={handleBulkApply}
        onClear={clearSelected}
        onSelectAll={selectAll}
      />
    </div>
  );
}