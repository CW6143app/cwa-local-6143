import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Download, Loader2, Shield } from "lucide-react";
import GrievanceDocument from "@/components/admin/GrievanceDocument";
import { downloadGrievancePdf, fetchSignatureDataUrl, grievanceNumber } from "@/lib/grievancePdf";

export default function GrievanceDetail() {
  const { id } = useParams();
  const [grievance, setGrievance] = useState(null);
  const [signature, setSignature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const record = await base44.entities.Grievance.get(id);
        if (!active) return;
        setGrievance(record);
        const dataUrl = await fetchSignatureDataUrl(record?.signature_initials);
        if (active) setSignature(dataUrl);
      } catch (err) {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const download = () => {
    try {
      downloadGrievancePdf(grievance, signature);
    } catch (err) {
      alert("Could not create the PDF. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 bg-[#0b2545] px-5 py-4 text-white shadow-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/admin/grievances"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 shrink-0 text-[#ff8a9b]" />
                <h1 className="truncate text-base font-bold">
                  {grievance ? `Grievance ${grievanceNumber(grievance)}` : "Grievance"}
                </h1>
              </div>
              <p className="mt-0.5 text-[11px] text-white/50">CWA Local 6143 — Admin View</p>
            </div>
          </div>
          {grievance && (
            <button
              onClick={download}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#c8102e] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#c8102e]/90"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#c8102e]" />
          </div>
        )}

        {!loading && failed && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-medium text-slate-500">
              This grievance could not be opened. It may have been removed.
            </p>
            <Link
              to="/admin/grievances"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#c8102e] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#c8102e]/90"
            >
              Back to Grievances
            </Link>
          </div>
        )}

        {!loading && !failed && grievance && <GrievanceDocument grievance={grievance} />}
      </div>
    </div>
  );
}