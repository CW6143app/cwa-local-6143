import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Download, Loader2, Eye } from "lucide-react";
import PageHeader from "@/components/mobile/PageHeader";

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.Contract.list("sort_order", 100);
        setContracts(Array.isArray(data) ? data : []);
      } catch {
        setContracts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleOpen = (c) => {
    if (c.file_url) window.open(c.file_url, "_blank");
  };

  return (
    <div className="pb-8">
      <PageHeader
        eyebrow="Local 6143"
        title="Contracts"
        subtitle="View or download the current collective bargaining agreements."
        showBack
      />

      <div className="px-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#c8102e]" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]">
            No contracts are available yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]">
            {contracts.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 border-b border-black/5 px-5 py-4 last:border-0"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c8102e]/10 text-[#c8102e]">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0b2545] truncate">{c.title}</p>
                  {!c.file_url && <span className="block text-xs text-slate-400 font-normal">Coming soon</span>}
                </div>
                {c.file_url && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpen(c)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c8102e]/10 text-[#c8102e] hover:bg-[#c8102e]/20 transition-colors"
                      aria-label={`Open ${c.title}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={c.file_url}
                      download
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-[#0b2545] hover:bg-black/10 transition-colors"
                      aria-label={`Download ${c.title}`}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}