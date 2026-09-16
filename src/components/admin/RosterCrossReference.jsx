import React, { useState, useMemo, useRef } from "react";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, X, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

// Parse CSV text into array of row objects keyed by header.
function parseCsv(text) {
  const rows = [];
  let cur = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { cur.push(field); field = ""; }
      else if (ch === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (ch === "\r") { /* skip */ }
      else field += ch;
    }
  }
  if (field !== "" || cur.length) { cur.push(field); rows.push(cur); }

  if (!rows.length) return { headers: [], data: [] };
  const headers = rows[0].map((h) => (h || "").trim());
  const data = rows.slice(1)
    .filter((r) => r.some((c) => (c || "").trim() !== ""))
    .map((r) => {
      const o = {};
      headers.forEach((h, idx) => { o[h] = (r[idx] || "").trim(); });
      return o;
    });
  return { headers, data };
}

function normalizeName(first, last) {
  return `${(first || "").trim()} ${(last || "").trim()}`.replace(/\s+/g, " ").trim().toLowerCase();
}

function findColumn(headers, patterns) {
  return headers.find((h) => patterns.some((p) => p.test(h)));
}

// Map CSV columns to RosterMember entity fields (vp_group intentionally excluded — set manually).
const FIELD_ALIASES = {
  first_name: [/^first\s*name/i, /^first$/i, /^fname$/i, /^f_?name$/i],
  last_name: [/^last\s*name/i, /^last$/i, /^lname$/i, /^l_?name$/i, /^surname$/i],
  processing_unit: [/processing\s*unit/i, /department/i, /^dept$/i],
  job_title: [/job\s*title/i, /^title$/i, /^position$/i],
  status: [/^status$/i, /member\s*status/i],
  building_city: [/building\s*city/i, /^city$/i, /^location$/i, /^office$/i],
  ncs_date: [/^ncs/i, /^ncs\s*date$/i],
  notes: [/^notes?$/i, /^comment/i]
};

function detectFieldMap(headers) {
  const map = {};
  Object.entries(FIELD_ALIASES).forEach(([field, patterns]) => {
    map[field] = findColumn(headers, patterns) || "";
  });
  return map;
}

function buildMemberFromRow(row, fieldMap) {
  const member = {};
  Object.entries(fieldMap).forEach(([field, col]) => {
    if (col && row[col] != null) member[field] = row[col].trim();
  });
  // Clean up empty strings for the date field
  if (!member.ncs_date) delete member.ncs_date;
  return member;
}

export default function RosterCrossReference({ members, onAdded, onClose }) {
  const [parsed, setParsed] = useState(null); // { headers, data }
  const [fileName, setFileName] = useState("");
  const [firstCol, setFirstCol] = useState("");
  const [lastCol, setLastCol] = useState("");
  const [fieldMap, setFieldMap] = useState({});
  const [addedKeys, setAddedKeys] = useState(new Set());
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    setError("");
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) { setError("Please upload a .csv file."); return; }
    try {
      const text = await file.text();
      const { headers, data } = parseCsv(text);
      if (!headers.length) { setError("Could not read CSV headers."); return; }
      setParsed({ headers, data });
      setFileName(file.name);
      const fc = findColumn(headers, [/^first\s*name/i, /^first$/i, /^fname$/i, /^f_?name$/i]) || headers[0];
      const lc = findColumn(headers, [/last\s*name/i, /^last$/i, /^lname$/i, /^l_?name$/i, /^surname$/i]) || headers[1] || headers[0];
      setFirstCol(fc);
      setLastCol(lc);
      setFieldMap(detectFieldMap(headers));
      setAddedKeys(new Set());
    } catch (e) {
      setError("Failed to read the file.");
    }
  };

  const comparison = useMemo(() => {
    if (!parsed || !firstCol || !lastCol) return null;
    const rosterSet = new Set(
      members.map((m) => normalizeName(m.first_name, m.last_name)).filter(Boolean)
    );
    const csvSet = new Set();
    const csvRows = parsed.data.map((row) => {
      const key = normalizeName(row[firstCol], row[lastCol]);
      if (key) csvSet.add(key);
      return { ...row, _key: key, _name: `${row[firstCol]} ${row[lastCol]}`.trim() };
    }).filter((r) => r._key);

    const missingFromRoster = csvRows.filter((r) => !rosterSet.has(r._key));
    const extraInRoster = members
      .map((m) => ({ ...m, _key: normalizeName(m.first_name, m.last_name), _name: `${m.first_name} ${m.last_name}`.trim() }))
      .filter((m) => m._key && !csvSet.has(m._key));

    return { missingFromRoster, extraInRoster, totalCsv: csvRows.length, totalRoster: members.length };
  }, [parsed, firstCol, lastCol, members]);

  const addRow = async (row) => {
    setError("");
    setAdding(true);
    try {
      const payload = buildMemberFromRow(row, fieldMap);
      await base44.entities.RosterMember.create(payload);
      setAddedKeys((s) => new Set(s).add(row._key));
      if (onAdded) onAdded();
    } catch (e) {
      setError(e.message || "Failed to add member.");
    } finally {
      setAdding(false);
    }
  };

  const addAllMissing = async () => {
    setError("");
    setAdding(true);
    try {
      const toAdd = comparison.missingFromRoster.filter((r) => !addedKeys.has(r._key));
      const payloads = toAdd.map((r) => buildMemberFromRow(r, fieldMap));
      if (payloads.length) {
        await base44.entities.RosterMember.bulkCreate(payloads);
        setAddedKeys((s) => new Set([...s, ...toAdd.map((r) => r._key)]));
        if (onAdded) onAdded();
      }
    } catch (e) {
      setError(e.message || "Failed to add members.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#0b2545]" />
          <h2 className="text-sm font-bold text-[#0b2545]">Cross-Reference CSV</h2>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Upload a roster CSV to compare against the {members.length} members currently in the app. Matching is done by First + Last name.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          className="h-9"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-4 h-4" /> Choose CSV
        </Button>
        {fileName && <span className="text-xs text-slate-600 truncate max-w-[200px]">{fileName}</span>}
      </div>

      {error && <p className="mt-3 text-xs text-[#c8102e]">{error}</p>}

      {parsed && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-[#0b2545]">First Name column</label>
            <select value={firstCol} onChange={(e) => setFirstCol(e.target.value)} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm">
              {parsed.headers.map((h) => <option key={h} value={h}>{h || "(empty)"}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[#0b2545]">Last Name column</label>
            <select value={lastCol} onChange={(e) => setLastCol(e.target.value)} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm">
              {parsed.headers.map((h) => <option key={h} value={h}>{h || "(empty)"}</option>)}
            </select>
          </div>
        </div>
      )}

      {comparison && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">CSV rows: {comparison.totalCsv}</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">App roster: {comparison.totalRoster}</span>
            <span className="px-2.5 py-1 rounded-full bg-[#c8102e]/10 text-[#c8102e] font-semibold">Missing from app: {comparison.missingFromRoster.filter((r) => !addedKeys.has(r._key)).length}</span>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">Extra in app: {comparison.extraInRoster.length}</span>
          </div>

          {comparison.missingFromRoster.length > 0 && (
            <div className="rounded-lg border border-[#c8102e]/20 bg-[#c8102e]/5 p-3">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#c8102e]" />
                  <h3 className="text-sm font-semibold text-[#c8102e]">
                    In CSV but not in app roster ({comparison.missingFromRoster.filter((r) => !addedKeys.has(r._key)).length})
                  </h3>
                </div>
                <button
                  onClick={addAllMissing}
                  disabled={adding}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c8102e] text-white text-xs font-semibold hover:bg-[#c8102e]/90 disabled:opacity-50 transition-colors"
                >
                  {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  Add all to roster
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-2">Added members are created without a VP Group — assign that manually.</p>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-[#c8102e]/10">
                    {comparison.missingFromRoster.filter((r) => !addedKeys.has(r._key)).map((r, i) => (
                      <tr key={i}>
                        <td className="py-1.5 pr-3 text-slate-800 font-medium">{r._name}</td>
                        <td className="py-1.5 text-slate-500 text-xs">{r.job_title || r["Job Title"] || r["Title"] || ""}</td>
                        <td className="py-1.5 text-right">
                          <button
                            onClick={() => addRow(r)}
                            disabled={adding}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#c8102e]/10 text-[#c8102e] text-xs font-semibold hover:bg-[#c8102e]/20 disabled:opacity-50 transition-colors"
                          >
                            <UserPlus className="w-3 h-3" /> Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {comparison.extraInRoster.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-700">In app roster but not in CSV ({comparison.extraInRoster.length})</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-amber-100">
                    {comparison.extraInRoster.map((m, i) => (
                      <tr key={m.id || i}>
                        <td className="py-1.5 pr-3 text-slate-800 font-medium">{m._name}</td>
                        <td className="py-1.5 text-slate-500 text-xs">{m.job_title || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {comparison.missingFromRoster.length === 0 && comparison.extraInRoster.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> All employees match between the CSV and the app roster.
            </div>
          )}
        </div>
      )}
    </div>
  );
}