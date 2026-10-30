import React from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SaleItemsEditor({ items, onChange }) {
  const patch = (index, changes) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...changes } : item)));
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-black/10 p-3 space-y-2">
          <div className="flex gap-2">
            <Input
              value={item.name || ""}
              onChange={(e) => patch(index, { name: e.target.value })}
              placeholder="Item name (e.g. BBQ Plate)"
              className="h-9 flex-1"
            />
            <Input
              value={item.price ?? ""}
              onChange={(e) => patch(index, { price: e.target.value })}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="h-9 w-24"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              aria-label="Remove item"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/5 text-[#c8102e]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <Input
            value={item.sizes || ""}
            onChange={(e) => patch(index, { sizes: e.target.value })}
            placeholder="Sizes (optional): S, M, L, XL"
            className="h-9"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { name: "", price: "", sizes: "" }])}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-black/15 text-xs font-semibold text-[#0b2545]"
      >
        <Plus className="w-4 h-4" /> Add item
      </button>
    </div>
  );
}