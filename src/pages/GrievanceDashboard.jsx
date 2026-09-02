import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Shield, ChevronDown, FileText, Inbox, CheckCircle2, Clock } from 'lucide-react';
import SheetSelect from '@/components/mobile/SheetSelect';

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { value: 'in_review', label: 'In Review', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' }
];

const getStatusMeta = (status) => STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

function StatusBadge({ status }) {
  const meta = getStatusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, count, tint }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tint}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900 leading-none">{count}</p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export default function GrievanceDashboard() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadGrievances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await base44.entities.Grievance.list('-created_date', 200);
      setGrievances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load grievances:', err);
      setError('Unable to load grievances. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGrievances();
  }, [loadGrievances]);

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await base44.entities.Grievance.update(id, { status: newStatus });
      setGrievances((prev) =>
        prev.map((g) => (g.id === id ? { ...g, status: newStatus } : g))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = {
    total: grievances.length,
    submitted: grievances.filter((g) => g.status === 'submitted').length,
    in_review: grievances.filter((g) => g.status === 'in_review').length,
    resolved: grievances.filter((g) => g.status === 'resolved').length
  };

  const filtered = filter === 'all' ? grievances : grievances.filter((g) => g.status === filter);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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
                <Shield className="w-4 h-4 text-[#ff8a9b]" />
                <h1 className="text-base font-bold">Grievance Dashboard</h1>
              </div>
              <p className="text-[11px] text-white/50 mt-0.5">CWA Local 6143 — Admin View</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Inbox} label="Total" count={counts.total} tint="bg-slate-100 text-slate-600" />
          <StatCard icon={FileText} label="Submitted" count={counts.submitted} tint="bg-blue-100 text-blue-600" />
          <StatCard icon={Clock} label="In Review" count={counts.in_review} tint="bg-amber-100 text-amber-600" />
          <StatCard icon={CheckCircle2} label="Resolved" count={counts.resolved} tint="bg-green-100 text-green-600" />
        </div>

        {/* Filter tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'submitted', label: 'Submitted' },
            { key: 'in_review', label: 'In Review' },
            { key: 'resolved', label: 'Resolved' }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === f.key
                  ? 'bg-[#c8102e] text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[#c8102e] rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={loadGrievances}
              className="mt-3 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="mt-3 text-sm font-medium text-slate-500">No grievances found.</p>
          </div>
        )}

        {/* Table (desktop) / Cards (mobile) */}
        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="mt-6 hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 font-semibold">Grievant</th>
                    <th className="px-4 py-3 font-semibold">Incident Date</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Filed</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{g.name_of_grievant || '—'}</p>
                        <p className="text-xs text-slate-400">{g.local_grievance_num || 'No grievance #'}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{g.date_of_incident || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {Array.isArray(g.incident_type) && g.incident_type.length > 0
                          ? g.incident_type.join(', ')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {g.created_date ? new Date(g.created_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={g.status} /></td>
                      <td className="px-4 py-3">
                        <SheetSelect
                          value={g.status}
                          onValueChange={(val) => updateStatus(g.id, val)}
                          disabled={updatingId === g.id}
                          options={STATUS_OPTIONS}
                          label="Update Status"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="mt-6 space-y-3 md:hidden">
              {filtered.map((g) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(expandedId === g.id ? null : g.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{g.name_of_grievant || '—'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {g.date_of_incident || 'No incident date'} · {g.local_grievance_num || 'No #'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={g.status} />
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedId === g.id ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {expandedId === g.id && (
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                      <DetailRow label="Incident Type" value={Array.isArray(g.incident_type) && g.incident_type.length > 0 ? g.incident_type.join(', ') : '—'} />
                      <DetailRow label="Job Title" value={g.job_title || '—'} />
                      <DetailRow label="Department" value={g.department || '—'} />
                      <DetailRow label="Work Location" value={g.work_location || '—'} />
                      <DetailRow label="Manager" value={g.first_level_mgr || '—'} />
                      <DetailRow label="Grievance" value={g.explain_grievance || '—'} />
                      <DetailRow label="Settlement Expected" value={g.settlement_expected || '—'} />
                      <DetailRow label="Filed" value={g.created_date ? new Date(g.created_date).toLocaleString() : '—'} />

                      <div className="pt-2">
                        <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Update Status</label>
                        <div className="mt-2 flex gap-2">
                          {STATUS_OPTIONS.map((s) => (
                            <button
                              key={s.value}
                              disabled={updatingId === g.id}
                              onClick={() => updateStatus(g.id, s.value)}
                              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                                g.status === s.value
                                  ? 'bg-[#c8102e] text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-700 break-words">{value}</p>
    </div>
  );
}