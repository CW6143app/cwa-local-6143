import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import PageHeader from "@/components/mobile/PageHeader";
import { RESOURCE_GROUPS } from "@/lib/siteData";

export default function Resources() {
  return (
    <div>
      <PageHeader
        eyebrow="Local 6143"
        title="Member Resources"
        subtitle="Contracts, forms, benefits and ways to take action — all in one place."
      />
      <div className="space-y-8 px-6">
        {RESOURCE_GROUPS.map((g, gi) => (
          <div key={g.group}>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c8102e]">
              {g.group}
            </h2>
            <div className="mt-3 overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]">
              {g.links.map((l, i) => {
                const cls = "flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4 last:border-0";
                const inner = <><span className="text-sm font-medium text-[#0b2545]">{l.label}</span><ArrowUpRight className="w-4 h-4 shrink-0 text-slate-300" /></>;
                return l.internal ? (
                  <Link key={l.label} to={l.internal} className={cls}>{inner}</Link>
                ) : (
                  <motion.a key={l.label} href={l.url} target="_blank" rel="noreferrer"
                    initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: gi * 0.04 + i * 0.03 }}
                    whileTap={{ backgroundColor: "rgba(11,37,69,0.04)" }} className={cls}>
                    {inner}
                  </motion.a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}