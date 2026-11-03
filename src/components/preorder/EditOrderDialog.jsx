import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FulfillmentToggle from "@/components/preorder/FulfillmentToggle";
import EditOrderItems from "@/components/preorder/EditOrderItems";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const blankOrder = (order) => ({
  buyer_name: order?.buyer_name || "",
  email: order?.email || "",
  phone: order?.phone || "",
  fulfillment: order?.fulfillment || "pickup",
  pickup_time: order?.pickup_time || "",
  delivery_address: order?.delivery_address || "",
  delivery_instructions: order?.delivery_instructions || "",
  notes: order?.notes || "",
  items: (order?.items || []).map((item) => ({ ...item })),
});

export default function EditOrderDialog({ order, open, onOpenChange, onSave }) {
  const [form, setForm] = useState(blankOrder(order));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && order) setForm(blankOrder(order));
  }, [open, order]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const total = form.items.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
  const isDelivery = form.fulfillment === "delivery";

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(order, { ...form, total });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Edit pre-order</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-[#0b2545]">Name</Label>
              <Input value={form.buyer_name} onChange={set("buyer_name")} className="h-9" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-[#0b2545]">Email</Label>
              <Input type="email" value={form.email} onChange={set("email")} className="h-9" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-[#0b2545]">Phone</Label>
              <Input type="tel" value={form.phone} onChange={set("phone")} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-[#0b2545]">
                {isDelivery ? "Delivery time" : "Pick-up time"}
              </Label>
              <Input type="time" value={form.pickup_time} onChange={set("pickup_time")} className="h-9" />
            </div>
          </div>

          <FulfillmentToggle
            value={form.fulfillment}
            onChange={(value) => setForm((f) => ({ ...f, fulfillment: value }))}
          />

          {isDelivery && (
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#0b2545]">Delivery address</Label>
                <Input value={form.delivery_address} onChange={set("delivery_address")} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#0b2545]">Where to leave the food</Label>
                <Input
                  value={form.delivery_instructions}
                  onChange={set("delivery_instructions")}
                  className="h-9"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-medium text-[#0b2545]">Items</Label>
            <EditOrderItems
              items={form.items}
              onChange={(items) => setForm((f) => ({ ...f, items }))}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-[#0b2545]">Notes</Label>
            <Textarea value={form.notes} onChange={set("notes")} rows={2} className="resize-none" />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-sm font-semibold text-[#0b2545]">Order total</span>
            <span className="text-lg font-bold text-[#c8102e]">{money(total)}</span>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="h-10 bg-[#c8102e] text-white hover:bg-[#c8102e]/90">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}