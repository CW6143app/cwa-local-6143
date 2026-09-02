import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, User } from "lucide-react";
import { Image } from "@/components/ui/image";
import { EXEC_BOARD } from "@/lib/siteData";

export default function BoardMembers() {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c8102e]">
        Executive Board
      </h2>
      <div className="mt-4 space-y-3">
        {EXEC_BOARD.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-2xl border border-black/5 p-3"
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#0b2545]/5 flex items-center justify-center">
              {m.image ? (
                <Image src={m.image} alt={m.name} className="h-full w-full" fittingType="fill" />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#0b2545] truncate">{m.name}</p>
              <p className="text-xs text-slate-500 truncate">{m.title}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {m.email && (
                  <a href={`mailto:${m.email}`} className="flex items-center gap-1 text-[11px] text-[#c8102e] hover:underline">
                    <Mail className="w-3 h-3" /> {m.email}
                  </a>
                )}
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="flex items-center gap-1 text-[11px] text-[#c8102e] hover:underline">
                    <Phone className="w-3 h-3" /> {m.phone}
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}