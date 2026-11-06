import React from "react";
import PaymentNote from "@/components/preorder/PaymentNote";

export default function PaymentOptions({ sale, amount }) {
  const methods = [
    { key: "cashapp_info", label: "Pay by Cash App" },
    { key: "zelle_info", label: "Pay by Zelle" },
  ].filter((m) => sale?.[m.key]);

  if (methods.length === 0) return null;

  return (
    <div className="space-y-3">
      {methods.map((m) => (
        <PaymentNote key={m.key} label={m.label} info={sale[m.key]} amount={amount} />
      ))}
    </div>
  );
}