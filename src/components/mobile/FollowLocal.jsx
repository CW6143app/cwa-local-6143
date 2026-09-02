import React from "react";
import { Facebook, Twitter, Youtube, Instagram } from "lucide-react";
import { SOCIALS } from "@/lib/siteData";

const ICONS = {
  Facebook,
  Twitter,
  YouTube: Youtube,
  Instagram,
};

export default function FollowLocal() {
  return (
    <section className="px-6 pt-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0b2545] dark:text-slate-200">
        Follow the Local
      </h2>
      <div className="mt-3 flex gap-3">
        {SOCIALS.map((s) => {
          const Icon = ICONS[s.label];
          return (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              aria-label={s.label}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-[#0b2545] transition-colors hover:bg-[#c8102e] hover:text-white hover:border-[#c8102e] dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
            >
              {Icon && <Icon className="w-5 h-5" />}
            </a>
          );
        })}
      </div>
    </section>
  );
}