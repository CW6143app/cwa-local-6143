import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Paperclip, X, Loader2, FileText, ImageIcon } from "lucide-react";

const MAX_FILES = 5;
const MAX_SIZE_MB = 10;

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(name) {
  return /\.pdf$/i.test(name || "") ? FileText : ImageIcon;
}

export default function EvidenceUploader({ value = [], onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const files = Array.isArray(value) ? value : [];

  const handleFiles = async (fileList) => {
    setError("");
    const selected = Array.from(fileList || []);
    if (!selected.length) return;
    if (files.length + selected.length > MAX_FILES) {
      setError(`You can attach a maximum of ${MAX_FILES} files.`);
      return;
    }
    const oversized = selected.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized) {
      setError(`"${oversized.name}" exceeds the ${MAX_SIZE_MB}MB limit.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    // Simulate smooth indeterminate progress while uploads run
    let p = 0;
    const timer = setInterval(() => {
      p = Math.min(p + Math.random() * 18, 92);
      setProgress(p);
    }, 180);

    try {
      const uploaded = [];
      for (const f of selected) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: f });
        uploaded.push({ url: file_url, name: f.name, size: f.size });
      }
      clearInterval(timer);
      setProgress(100);
      onChange([...files, ...uploaded]);
    } catch (err) {
      clearInterval(timer);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 600);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeFile = (idx) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || files.length >= MAX_FILES}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#c8102e]/30 bg-[#c8102e]/5 px-4 py-4 text-sm font-medium text-[#c8102e] hover:bg-[#c8102e]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <Paperclip className="w-4 h-4" />
            {files.length >= MAX_FILES ? "Max files attached" : "Attach evidence (photo or PDF)"}
          </>
        )}
      </button>

      {uploading && (
        <div className="mt-3 w-full h-2 rounded-full bg-black/5 overflow-hidden">
          <div
            className="h-full bg-[#c8102e] rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-[#c8102e] break-words">{error}</p>
      )}

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f, idx) => {
            const Icon = fileIcon(f.name);
            return (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-xl border border-black/8 bg-white px-3 py-2.5 min-w-0"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#c8102e]/10 text-[#c8102e]">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#0b2545] truncate">{f.name}</p>
                  {f.size ? <p className="text-[11px] text-slate-400">{formatSize(f.size)}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-slate-500 hover:bg-black/10 transition-colors"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-2 text-[11px] text-slate-400">
        Photos or PDFs · up to {MAX_FILES} files, {MAX_SIZE_MB}MB each
      </p>
    </div>
  );
}