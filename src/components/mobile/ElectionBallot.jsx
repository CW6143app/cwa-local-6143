import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Vote, X } from "lucide-react";

const EXECUTIVE_BOARD = [
  { office: "President", name: "Danny DeOsio" },
  { office: "Executive Vice President", name: "Jeremy Garcia" },
  { office: "Secretary-Treasurer", name: "Tarea Smith" },
  { office: "Vice President 1", name: "Rey Puente" },
  { office: "Vice President 2", name: "JoAngela Barroso" },
  { office: "Vice President 3", name: "Jesse Espinosa" },
];

const CHIEF_STEWARDS = [
  { office: "V.P. 1 Chief Steward (Core)", name: "Vacant" },
  { office: "V.P. 1 Chief Steward (App J)", name: "Robert Martel" },
  { office: "V.P. 2 Chief Steward", name: "Gracie Fontenot" },
  { office: "V.P. 3 Chief Steward (Call Center)", name: "Rodney Garza" },
  { office: "V.P. 3 Chief Steward (Retail)", name: "Rick Mendez" },
];

export default function ElectionBallot() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#c8102e] px-5 py-4 text-white shadow-[0_8px_24px_-12px_rgba(200,16,46,0.6)]"
      >
        <Vote className="w-5 h-5" />
        <span className="text-sm font-bold uppercase tracking-[0.18em]">2026 Election Results</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#0b2545]">2026 Election Results</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Executive Board */}
              <div className="mt-5">
                <h4 className="text-sm font-bold uppercase tracking-[0.12em] text-[#c8102e]">Executive Board</h4>
                <ul className="mt-3 space-y-2.5">
                  {EXECUTIVE_BOARD.map((r) => (
                    <li key={r.office} className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2">
                      <span className="text-sm font-medium text-[#0b2545]">{r.office}</span>
                      <span className="text-sm text-slate-700 text-right">{r.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Chief Stewards */}
              <div className="mt-6">
                <h4 className="text-sm font-bold uppercase tracking-[0.12em] text-[#c8102e]">Chief Stewards</h4>
                <ul className="mt-3 space-y-2.5">
                  {CHIEF_STEWARDS.map((r) => (
                    <li key={r.office} className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2">
                      <span className="text-sm font-medium text-[#0b2545]">{r.office}</span>
                      <span className={`text-sm text-right ${r.name === "Vacant" ? "italic text-slate-400" : "text-slate-700"}`}>{r.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-6 w-full rounded-xl bg-[#c8102e] py-3 text-sm font-semibold text-white"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}