import React from "react";
import { Image } from "@/components/ui/image";
import { Paperclip } from "lucide-react";
import { grievanceSections, grievanceNumber } from "@/lib/grievancePdf";

function Field({ label, value }) {
  const text = value === null || value === undefined || String(value).trim() === "" ? "—" : String(value);
  return (
    <div className="border-b border-black/5 py-2.5 last:border-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[#0b2545]">{text}</p>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c8102e]">{children}</h3>
      <div className="mt-3 h-px w-full bg-[#c8102e]" />
    </>
  );
}

export default function GrievanceDocument({ grievance }) {
  const g = grievance || {};
  const hasSignature = /^https?:\/\//i.test(String(g.signature_initials || ""));
  const evidence = Array.isArray(g.evidence_files) ? g.evidence_files : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]">
      <div className="flex items-start justify-between gap-4 bg-[#c8102e] px-6 py-5 text-white">
        <div>
          <p className="text-lg font-bold leading-tight">CWA Local 6143</p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.24em] text-white/75">Grievance Form</p>
        </div>
        <div className="text-right">
          <p className="text-base font-bold leading-tight">{grievanceNumber(g)}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/75">Local 6143</p>
        </div>
      </div>

      <div className="px-6 pb-6">
        <p className="pt-5 text-xs leading-relaxed text-slate-500">
          Official record of the grievance filed with CWA Local 6143. This copy is provided to the grievant and to the Local.
        </p>

        {grievanceSections(g).map((section) => (
          <div key={section.title} className="mt-7">
            <SectionTitle>{section.title}</SectionTitle>
            {section.title === "Signature" && (
              <div className="mt-3">
                {hasSignature ? (
                  <Image
                    src={g.signature_initials}
                    alt="Grievant signature"
                    fittingType="fit"
                    className="h-24 w-full max-w-xs rounded-lg border border-black/10 bg-white"
                  />
                ) : (
                  <p className="text-sm italic text-slate-400">No signature provided</p>
                )}
              </div>
            )}
            <div className="mt-2">
              {section.fields.map(([label, value]) => (
                <Field key={label} label={label} value={value} />
              ))}
            </div>
          </div>
        ))}

        {evidence.length > 0 && (
          <div className="mt-7">
            <SectionTitle>Attachments</SectionTitle>
            <div className="mt-3 space-y-2">
              {evidence.map((file, i) => (
                <a
                  key={`${file?.name || "file"}-${i}`}
                  href={file?.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-3 text-sm font-medium text-[#0b2545] hover:bg-black/5 transition-colors"
                >
                  <Paperclip className="w-4 h-4 shrink-0 text-[#c8102e]" />
                  <span className="truncate">{file?.name || `File ${i + 1}`}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="border-t border-black/5 px-6 py-4 text-[11px] text-slate-400">
        Submitted through the CWA Local 6143 mobile app
      </p>
    </div>
  );
}