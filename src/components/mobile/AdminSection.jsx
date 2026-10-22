import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { ShieldCheck, FileText, Lightbulb, Users, RefreshCw, FileStack, ChevronRight } from "lucide-react";

const LINKS = [
  { to: "/admin/grievances", label: "Submitted Grievances", hint: "Submitted grievance forms", icon: FileText },
  { to: "/admin/pmei", label: "PMEI Submissions", hint: "Member ideas and solutions", icon: Lightbulb },
  { to: "/admin/roster", label: "VP Group Roster", hint: "Member roster and CSV tools", icon: Users },
  { to: "/admin/sync", label: "Website Sync", hint: "Pull news, events, meetings", icon: RefreshCw },
  { to: "/admin/contracts", label: "Contracts", hint: "Published contract files", icon: FileStack },
];

export default function AdminSection() {
  const { user, isLoadingAuth, authChecked } = useAuth();

  if (isLoadingAuth || !authChecked || user?.role !== "admin") return null;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#c8102e]" />
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c8102e]">
          Admin
        </h2>
      </div>
      <div className="mt-2 divide-y divide-black/5">
        {LINKS.map(({ to, label, hint, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 py-3.5 -mx-1 px-1 rounded-xl hover:bg-black/5 transition-colors"
          >
            <Icon className="w-4 h-4 shrink-0 text-[#0b2545]" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[#0b2545]">{label}</span>
              <span className="block text-xs text-slate-500 truncate">{hint}</span>
            </span>
            <ChevronRight className="w-4 h-4 shrink-0 text-slate-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}