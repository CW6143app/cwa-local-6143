import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PageHeader({ eyebrow, title, subtitle, showBack }) {
  const navigate = useNavigate();
  return (
    <header className="px-6 pt-12 pb-6">
      {showBack && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/5 text-[#0b2545] hover:bg-black/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      {eyebrow && (
        <p className="text-[10px] uppercase tracking-[0.28em] text-destructive-foreground font-semibold">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 text-sm leading-relaxed text-slate-500">{subtitle}</p>
      )}
    </header>
  );
}