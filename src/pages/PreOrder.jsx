import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Download, Loader2, ShoppingBag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { downloadPreOrderPdf } from "@/lib/preOrderPdf";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import OrderItems from "@/components/preorder/OrderItems";
import FulfillmentToggle from "@/components/preorder/FulfillmentToggle";
import DeliveryFields from "@/components/preorder/DeliveryFields";
import PickupTime from "@/components/preorder/PickupTime";
import ZelleNote from "@/components/preorder/ZelleNote";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const prettyTime = (time) => {
  if (!time) return "—";
  const [h, m] = String(time).split(":").map(Number);
  if (Number.isNaN(h)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(Number.isNaN(m) ? 0 : m).padStart(2, "0")} ${suffix}`;
};

export default function PreOrder() {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState({});
  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "", notes: "" });
  const [pickupTime, setPickupTime] = useState("");
  const [fulfillment, setFulfillment] = useState("pickup");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const page = await base44.entities.PreOrderSale.filter({ active: true }, { limit: 1 });
        setSale((page?.items || [])[0] || null);
      } catch (err) {
        setError("Unable to load the pre-order right now.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateSelection = (index, changes) =>
    setSelections((prev) => ({ ...prev, [index]: { ...(prev[index] || {}), ...changes } }));

  const saleItems = sale?.items || [];
  const lines = saleItems
    .map((item, index) => {
      const sel = selections[index] || {};
      const quantity = sel.qty || 0;
      return {
        name: item.name,
        size: sel.size || "",
        quantity,
        unit_price: Number(item.price || 0),
        line_total: quantity * Number(item.price || 0),
        needsSize: (item.sizes || []).length > 0,
      };
    })
    .filter((line) => line.quantity > 0);
  const total = lines.reduce((sum, line) => sum + line.line_total, 0);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (lines.length === 0) {
      setError("Add at least one item to your pre-order.");
      return;
    }
    const missingSize = lines.find((line) => line.needsSize && !line.size);
    if (missingSize) {
      setError(`Please choose a size for ${missingSize.name}.`);
      return;
    }
    if (!pickupTime) {
      setError(
        fulfillment === "delivery"
          ? "Please choose the time you need the food delivered."
          : "Please choose the time you need your food by."
      );
      return;
    }
    if (fulfillment === "delivery" && !address.trim()) {
      setError("Please enter the address where the food should be delivered.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await base44.entities.PreOrder.create({
        sale_id: sale.id,
        sale_title: sale.title,
        buyer_name: buyer.name.trim(),
        email: buyer.email.trim(),
        phone: buyer.phone.trim(),
        fulfillment,
        pickup_time: pickupTime,
        delivery_address: fulfillment === "delivery" ? address.trim() : "",
        delivery_instructions: fulfillment === "delivery" ? instructions.trim() : "",
        notes: buyer.notes.trim(),
        items: lines.map(({ needsSize, ...line }) => line),
        total,
        paid: false,
        status: "submitted",
      });
      base44.functions.invoke("notifyPreOrder", { orderId: created.id }).catch(() => {});
      setPlaced({ ...created, items: lines, total });
    } catch (err) {
      setError("Could not submit your pre-order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#c8102e] animate-spin" />
      </div>
    );
  }

  if (placed) {
    return (
      <div className="px-5 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white p-6 text-center shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]"
        >
          <CheckCircle2 className="mx-auto w-14 h-14 text-[#c8102e]" />
          <h2 className="mt-4 text-xl font-semibold text-[#0b2545]">Pre-Order Received</h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Thanks {placed.buyer_name}. We have your order for {placed.sale_title}.
            {sale?.pickup_info ? ` ${sale.pickup_info}` : ""}
          </p>
          <div className="mt-5 space-y-2 text-left">
            {placed.items.map((line, i) => (
              <div key={i} className="flex justify-between text-sm text-[#0b2545]">
                <span>
                  {line.quantity}× {line.name}
                  {line.size ? ` (${line.size})` : ""}
                </span>
                <span className="font-semibold">{money(line.line_total)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-black/10 pt-2 text-sm font-bold text-[#0b2545]">
              <span>Total</span>
              <span>{money(placed.total)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-sm text-[#0b2545]">
              <span className="text-slate-500">{placed.fulfillment === "delivery" ? "Delivery time" : "Pick-up time"}</span>
              <span className="font-semibold">{prettyTime(placed.pickup_time)}</span>
            </div>
            {placed.fulfillment === "delivery" && (placed.delivery_address || placed.delivery_instructions) && (
              <div className="space-y-1 border-t border-black/10 pt-2 text-sm text-[#0b2545]">
                {placed.delivery_address && (
                  <div>
                    <span className="text-slate-500">Delivering to</span>
                    <p className="font-semibold">{placed.delivery_address}</p>
                  </div>
                )}
                {placed.delivery_instructions && (
                  <div>
                    <span className="text-slate-500">Where to leave it</span>
                    <p className="font-semibold">{placed.delivery_instructions}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mt-4 text-left">
            <ZelleNote zelleInfo={sale?.zelle_info} amount={placed.total} />
          </div>
          <button
            type="button"
            onClick={() => downloadPreOrderPdf(placed.id)}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#0b2545]/15 text-sm font-semibold text-[#0b2545] transition-colors hover:bg-black/5"
          >
            <Download className="w-4 h-4" /> Download / Print Ticket
          </button>
        </motion.div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="px-6 pt-16 text-center">
        <ShoppingBag className="mx-auto w-12 h-12 text-slate-300" />
        <h2 className="mt-4 text-lg font-semibold text-[#0b2545]">No pre-order open right now</h2>
        <p className="mt-2 text-sm text-slate-500">
          Check back when the next plate sale or shirt order opens.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="bg-[#b31414] px-6 pt-10 pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/60">Local 6143</p>
        <h1 className="mt-1 text-xl font-semibold text-white leading-tight">{sale.title}</h1>
        {sale.description && (
          <p className="mt-2 text-sm text-white/80 leading-relaxed">{sale.description}</p>
        )}
      </div>

      <form onSubmit={submit} className="px-5 pt-6 space-y-5">
        <div className="rounded-2xl bg-white p-5 space-y-3 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_8px_24px_-12px_rgba(11,37,69,0.2)]">
          <FulfillmentToggle value={fulfillment} onChange={setFulfillment} />
          <h2 className="pt-2 text-sm font-semibold text-[#0b2545]">Choose your items</h2>
          {saleItems.length === 0 ? (
            <p className="text-xs text-slate-500">Items will be posted soon.</p>
          ) : (
            <OrderItems items={saleItems} selections={selections} onChange={updateSelection} />
          )}
          <PickupTime value={pickupTime} onChange={setPickupTime} mode={fulfillment} />
          {fulfillment === "delivery" && (
            <DeliveryFields
              address={address}
              instructions={instructions}
              onAddressChange={setAddress}
              onInstructionsChange={setInstructions}
            />
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 space-y-4 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_8px_24px_-12px_rgba(11,37,69,0.2)]">
          <h2 className="text-sm font-semibold text-[#0b2545]">Your details</h2>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-[#0b2545]">
              Name<span className="text-[#c8102e]"> *</span>
            </Label>
            <Input
              value={buyer.name}
              onChange={(e) => setBuyer((b) => ({ ...b, name: e.target.value }))}
              required
              className="h-10"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-[#0b2545]">
              Email<span className="text-[#c8102e]"> *</span>
            </Label>
            <Input
              value={buyer.email}
              onChange={(e) => setBuyer((b) => ({ ...b, email: e.target.value }))}
              type="email"
              required
              className="h-10"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-[#0b2545]">Phone</Label>
            <Input
              value={buyer.phone}
              onChange={(e) => setBuyer((b) => ({ ...b, phone: e.target.value }))}
              type="tel"
              className="h-10"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-[#0b2545]">Notes</Label>
            <Textarea
              value={buyer.notes}
              onChange={(e) => setBuyer((b) => ({ ...b, notes: e.target.value }))}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        {sale.zelle_info && <ZelleNote zelleInfo={sale.zelle_info} amount={total} />}

        <div className="rounded-2xl bg-white p-5 flex items-center justify-between shadow-[0_1px_2px_rgba(11,37,69,0.06),0_8px_24px_-12px_rgba(11,37,69,0.2)]">
          <span className="text-sm font-semibold text-[#0b2545]">Total</span>
          <span className="text-lg font-bold text-[#c8102e]">{money(total)}</span>
        </div>

        {error && <div className="rounded-xl bg-[#c8102e]/10 p-3 text-sm text-[#c8102e]">{error}</div>}

        <Button
          type="submit"
          disabled={submitting || lines.length === 0}
          className="h-12 w-full bg-[#c8102e] text-sm font-semibold text-white hover:bg-[#c8102e]/90"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <ShoppingBag className="mr-2 w-4 h-4" /> Submit Pre-Order
            </>
          )}
        </Button>
      </form>
    </div>
  );
}