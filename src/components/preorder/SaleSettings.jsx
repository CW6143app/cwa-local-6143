import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SaleItemsEditor from "@/components/preorder/SaleItemsEditor";

export default function SaleSettings({ sale, onSaved }) {
  const [form, setForm] = useState({
    title: sale?.title || "",
    description: sale?.description || "",
    pickup_info: sale?.pickup_info || "",
    zelle_info: sale?.zelle_info || "",
    active: !!sale?.active,
    items: (sale?.items || []).map((i) => ({
      name: i.name || "",
      price: i.price ?? "",
      sizes: (i.sizes || []).join(", "),
    })),
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setMessage("");
    const payload = {
      title: form.title.trim() || "Pre-Order",
      description: form.description,
      pickup_info: form.pickup_info,
      zelle_info: form.zelle_info.trim(),
      active: form.active,
      items: form.items
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name.trim(),
          price: Number(i.price) || 0,
          sizes: String(i.sizes || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        })),
    };
    try {
      const saved = sale?.id
        ? await base44.entities.PreOrderSale.update(sale.id, payload)
        : await base44.entities.PreOrderSale.create(payload);
      onSaved(saved);
      setMessage("Saved");
    } catch (err) {
      setMessage("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 space-y-4 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_8px_24px_-12px_rgba(11,37,69,0.2)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0b2545]">Sale Setup</h2>
          <p className="text-xs text-slate-500">Turn the tab on or off and set what is for sale.</p>
        </div>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
          className={`h-10 rounded-full px-4 text-xs font-semibold transition-colors ${
            form.active ? "bg-green-600 text-white" : "bg-black/10 text-slate-600"
          }`}
        >
          {form.active ? "Open" : "Closed"}
        </button>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium text-[#0b2545]">Sale title</Label>
        <Input value={form.title} onChange={set("title")} placeholder="Fall Plate Sale" className="h-9" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-medium text-[#0b2545]">Description</Label>
        <Textarea value={form.description} onChange={set("description")} rows={2} className="resize-none" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-medium text-[#0b2545]">Pickup / payment note</Label>
        <Textarea
          value={form.pickup_info}
          onChange={set("pickup_info")}
          rows={2}
          placeholder="Pick up at the union hall on Nov 14, 11am–2pm."
          className="resize-none"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium text-[#0b2545]">Zelle email or phone</Label>
        <Input
          value={form.zelle_info}
          onChange={set("zelle_info")}
          placeholder="treasurer@cwa6143.org"
          className="h-9"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-[#0b2545]">Items</Label>
        <SaleItemsEditor items={form.items} onChange={(items) => setForm((f) => ({ ...f, items }))} />
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="h-11 w-full rounded-xl bg-[#c8102e] text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save sale"}
      </button>
      {message && <p className="text-xs text-slate-500 text-center">{message}</p>}
    </div>
  );
}