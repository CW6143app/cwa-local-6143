import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function EditOrderItems({ items, onChange }) {
  const update = (index, changes) => {
    onChange(
      items.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...changes };
        next.line_total = Number(
          (Number(next.quantity || 0) * Number(next.unit_price || 0)).toFixed(2)
        );
        return next;
      })
    );
  };

  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  const add = () =>
    onChange([
      ...items,
      { name: "", size: "", quantity: 1, unit_price: 0, line_total: 0 },
    ]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        <span className="col-span-5">Item</span>
        <span className="col-span-2">Size</span>
        <span className="col-span-2">Qty</span>
        <span className="col-span-2">Price</span>
        <span className="col-span-1" />
      </div>

      {items.length === 0 && (
        <p className="text-xs text-slate-500">No items on this order yet.</p>
      )}

      {items.map((item, index) => (
        <div key={index} className="grid grid-cols-12 items-center gap-2">
          <Input
            value={item.name || ""}
            onChange={(e) => update(index, { name: e.target.value })}
            placeholder="Item"
            className="col-span-5 h-9"
          />
          <Input
            value={item.size || ""}
            onChange={(e) => update(index, { size: e.target.value })}
            placeholder="—"
            className="col-span-2 h-9 px-2"
          />
          <Input
            type="number"
            min="0"
            value={item.quantity ?? 0}
            onChange={(e) => update(index, { quantity: Number(e.target.value) })}
            className="col-span-2 h-9 px-2"
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.unit_price ?? 0}
            onChange={(e) => update(index, { unit_price: Number(e.target.value) })}
            className="col-span-2 h-9 px-2"
          />
          <button
            type="button"
            onClick={() => remove(index)}
            aria-label="Remove item"
            className="col-span-1 flex h-9 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#0b2545]/15 px-3 text-xs font-semibold text-[#0b2545] transition-colors hover:bg-black/5"
      >
        <Plus className="h-3.5 w-3.5" /> Add item
      </button>
    </div>
  );
}