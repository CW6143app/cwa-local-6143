import React from "react";
import { Minus, Plus } from "lucide-react";
import SheetSelect from "@/components/mobile/SheetSelect";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function OrderItems({ items, selections, onChange }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const sel = selections[index] || { size: "", qty: 0 };
        const sizes = item.sizes || [];
        return (
          <div key={index} className="rounded-xl border border-black/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0b2545]">{item.name}</p>
                <p className="text-xs text-slate-500">{money(item.price)} each</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  aria-label={`Remove one ${item.name}`}
                  onClick={() => onChange(index, { qty: Math.max(0, (sel.qty || 0) - 1) })}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5 text-[#0b2545] active:scale-95 transition-transform"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center text-base font-semibold text-[#0b2545]">
                  {sel.qty || 0}
                </span>
                <button
                  type="button"
                  aria-label={`Add one ${item.name}`}
                  onClick={() => onChange(index, { qty: (sel.qty || 0) + 1 })}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c8102e] text-white active:scale-95 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            {sizes.length > 0 && (sel.qty || 0) > 0 && (
              <div className="mt-3">
                <SheetSelect
                  value={sel.size || ""}
                  onValueChange={(value) => onChange(index, { size: value })}
                  options={sizes.map((s) => ({ value: s, label: s }))}
                  placeholder="Select size"
                  label={`Size for ${item.name}`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}