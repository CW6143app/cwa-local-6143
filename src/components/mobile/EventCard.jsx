import React from "react";
import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";

export default function EventCard({ event, index = 0 }) {
  return (
    <motion.a
      href={event.url}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.985 }}
      className="flex gap-4 rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]"
    >
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#0b2545] text-white">
        <span className="text-xl font-semibold leading-none">{event.day}</span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/70">
          {event.month}
        </span>
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-semibold leading-snug text-[#0b2545]">
          {event.title}
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5 text-[#c8102e]" /> {event.time}
        </p>
        <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500">
          <MapPin className="mt-0.5 w-3.5 h-3.5 shrink-0 text-[#c8102e]" />
          {event.location}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">{event.note}</p>
      </div>
    </motion.a>
  );
}