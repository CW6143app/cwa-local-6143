import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, FileDown } from "lucide-react";
import SheetSelect from "@/components/mobile/SheetSelect";
import { downloadPreOrderPdf } from "@/lib/preOrderPdf";

export const ORDER_STATUS = [
  { value: "submitted", label: "Submitted", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  { value: "ready", label: "Ready", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  { value: "picked_up", label: "Picked Up", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
];

const statusMeta = (status) => ORDER_STATUS.find((s) => s.value === status) || ORDER_STATUS[0];
const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const prettyTime = (time) => {
  if (!time) return "—";
  const [h, m] = String(time).split(":").map(Number);
  if (Number.isNaN(h)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(Number.isNaN(m) ? 0 : m).padStart(2, "0")} ${suffix}`;
};

function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

const itemsSummary = (order) =>
  (order.items || [])
    .map((i) => `${i.quantity}× ${i.name}${i.size ? ` (${i.size})` : ""}`)
    .join(", ") || "—";

function PdfButton({ orderId, full }) {
  return (
    <button
      type="button"
      onClick={() => downloadPreOrderPdf(orderId)}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-[#0b2545] transition-colors hover:bg-black/10 ${
        full ? "w-full" : ""
      }`}
    >
      <FileDown className="w-3.5 h-3.5" /> PDF
    </button>
  );
}

function PaidToggle({ paid, disabled, onToggle }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
        paid ? "bg-green-100 text-green-700" : "bg-black/5 text-slate-600"
      }`}
    >
      {paid ? "Paid" : "Unpaid"}
    </button>
  );
}

export default function OrderList({ orders, updatingId, onStatusChange, onPaidToggle }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <>
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Items</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Fulfillment</th>
              <th className="px-4 py-3 font-semibold">Paid</th>
              <th className="px-4 py-3 font-semibold">Ticket</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{order.buyer_name || "—"}</p>
                  <p className="text-xs text-slate-500">{order.email || "—"}</p>
                </td>
                <td className="px-4 py-3 text-slate-600 max-w-[260px]">{itemsSummary(order)}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{money(order.total)}</td>
                <td className="px-4 py-3 text-slate-600">
                  <p className="font-medium text-slate-700">
                    {order.fulfillment === "delivery" ? "Delivery" : "Pick-up"}
                  </p>
                  <p className="text-xs text-slate-500">{prettyTime(order.pickup_time)}</p>
                  {order.fulfillment === "delivery" && order.delivery_address && (
                    <p className="mt-1 max-w-[200px] text-xs text-slate-500">{order.delivery_address}</p>
                  )}
                  {order.fulfillment === "delivery" && order.delivery_instructions && (
                    <p className="max-w-[200px] text-xs italic text-slate-400">{order.delivery_instructions}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <PaidToggle
                    paid={!!order.paid}
                    disabled={updatingId === order.id}
                    onToggle={() => onPaidToggle(order)}
                  />
                </td>
                <td className="px-4 py-3">
                  <PdfButton orderId={order.id} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3">
                  <SheetSelect
                    value={order.status}
                    onValueChange={(value) => onStatusChange(order, value)}
                    disabled={updatingId === order.id}
                    options={ORDER_STATUS}
                    label="Update Status"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{order.buyer_name || "—"}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {money(order.total)} · {order.paid ? "Paid" : "Unpaid"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={order.status} />
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    expandedId === order.id ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>
            {expandedId === order.id && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Items</p>
                  <p className="mt-0.5 text-sm text-slate-700">{itemsSummary(order)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {order.fulfillment === "delivery" ? "Delivery Time" : "Pick-Up Time"}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-700">{prettyTime(order.pickup_time)}</p>
                </div>
                {order.fulfillment === "delivery" && order.delivery_address && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Delivery Address</p>
                    <p className="mt-0.5 text-sm text-slate-700">{order.delivery_address}</p>
                  </div>
                )}
                {order.fulfillment === "delivery" && order.delivery_instructions && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Where to Leave Food</p>
                    <p className="mt-0.5 text-sm text-slate-700">{order.delivery_instructions}</p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Contact</p>
                  <p className="mt-0.5 text-sm text-slate-700">
                    {[order.email, order.phone].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                {order.notes && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Notes</p>
                    <p className="mt-0.5 text-sm text-slate-700">{order.notes}</p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Filed</p>
                  <p className="mt-0.5 text-sm text-slate-700">
                    {order.created_date ? new Date(order.created_date).toLocaleString() : "—"}
                  </p>
                </div>
                <PdfButton orderId={order.id} full />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Paid</span>
                  <PaidToggle
                    paid={!!order.paid}
                    disabled={updatingId === order.id}
                    onToggle={() => onPaidToggle(order)}
                  />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
                  <div className="mt-2">
                    <SheetSelect
                      value={order.status}
                      onValueChange={(value) => onStatusChange(order, value)}
                      disabled={updatingId === order.id}
                      options={ORDER_STATUS}
                      label="Update Status"
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </>
  );
}