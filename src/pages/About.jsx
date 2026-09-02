import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Globe, ArrowUpRight } from "lucide-react";
import PageHeader from "@/components/mobile/PageHeader";
import { SITE, SOCIALS } from "@/lib/siteData";
import AccountSettings from "@/components/mobile/AccountSettings";

export default function About() {
  return (
    <div>
      <PageHeader
        eyebrow="About"
        title="CWA Local 6143"
        subtitle="Representing working people in San Antonio, Texas — part of the Communications Workers of America, District 6."
      />
      <div className="space-y-4 px-6">
        <div className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]">
          <p className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="mt-0.5 w-4 h-4 shrink-0 text-[#c8102e]" />
            {SITE.address}
          </p>
          <a
            href={`${SITE.site}/about-us`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center gap-2 text-sm font-medium text-[#0b2545]"
          >
            <Globe className="w-4 h-4 text-[#c8102e]" /> Visit cwa6143.org
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
          </a>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c8102e]">
            Follow the Local
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-black/10 px-4 py-2 text-xs font-medium text-[#0b2545]"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <AccountSettings />

        <Link
          to="/grievance"
          className="block rounded-2xl bg-[#c8102e] py-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white"
        >
          File a grievance
        </Link>
      </div>
    </div>
  );
}