import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Loader2 } from "lucide-react";

export default function PdfViewerModal({ open, onClose, title, fileUrl }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let createdUrl = null;
    if (!open || !fileUrl) {
      setSrc(null);
      return;
    }
    setLoading(true);
    setSrc(null);
    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.blob();
      })
      .then((blob) => {
        const typed = new Blob([blob], { type: "application/pdf" });
        createdUrl = URL.createObjectURL(typed);
        if (!cancelled) setSrc(createdUrl);
      })
      .catch(() => {
        // CORS or other failure — fall back to Google Docs Viewer embed
        if (!cancelled) {
          setSrc(`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [open, fileUrl]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="w-full sm:w-[92%] sm:max-w-3xl h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between gap-3 border-b border-black/8 px-4 py-3 shrink-0">
              <h3 className="text-sm font-semibold text-[#0b2545] truncate">{title}</h3>
              <div className="flex items-center gap-2 shrink-0">
                {fileUrl && (
                  <a
                    href={fileUrl}
                    download
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-[#0b2545] hover:bg-black/10 transition-colors"
                    aria-label="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-[#0b2545] hover:bg-black/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 relative min-h-0">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#c8102e]" />
                </div>
              )}
              {src && (
                <iframe
                  src={src}
                  title={title}
                  className="absolute inset-0 w-full h-full border-0"
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}