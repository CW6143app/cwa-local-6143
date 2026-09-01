import React from "react";

export default function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <header className="px-6 pt-12 pb-6">
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