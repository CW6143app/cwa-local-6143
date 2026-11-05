import React from "react";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

// Cash App tags, links, emails and phone numbers each get the right link
const paymentHref = (info) => {
  const value = String(info).trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("$")) return `https://cash.app/$${encodeURIComponent(value.slice(1))}`;
  if (value.includes("@")) return `mailto:${value}`;
  const digits = value.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
};

export default function PaymentNote({ label, info, amount }) {
  if (!info) return null;
  const href = paymentHref(info);
  return (
    <div className="rounded-2xl border border-[#c8102e]/25 bg-[#c8102e]/5 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8102e]">{label}</p>
      <p className="mt-1.5 text-sm text-[#0b2545] leading-relaxed">
        Send {amount > 0 ? money(amount) : "payment"} to{" "}
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#c8102e] underline underline-offset-2 break-all"
          >
            {info}
          </a>
        ) : (
          <span className="font-semibold">{info}</span>
        )}{" "}
        and put your name in the memo so we can match it to your order.
      </p>
      <p className="mt-2 text-xs text-[#0b2545] leading-relaxed">
        You can also make a donation with {label.replace("Pay by ", "")} — just write{" "}
        <span className="font-semibold">Donation</span> in the memo.
      </p>
    </div>
  );
}