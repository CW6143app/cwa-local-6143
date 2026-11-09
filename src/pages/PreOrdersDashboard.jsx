import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Inbox, PackageCheck, Printer, Shield, ShoppingBag, DollarSign } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { printPreOrderList } from "@/lib/preOrderListPrint";
import SaleSettings from "@/components/preorder/SaleSettings";
import OrderList from "@/components/preorder/OrderList";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tint}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export default function PreOrdersDashboard() {
  const [sale, setSale] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [saleResult, orderList] = await Promise.all([
        base44.entities.PreOrderSale.list({ sort: "-created_date", limit: 1 }),
        base44.entities.PreOrder.list("-created_date", 300),
      ]);
      const saleRows = Array.isArray(saleResult) ? saleResult : saleResult?.items || [];
      setSale(saleRows[0] || null);
      setOrders(Array.isArray(orderList) ? orderList : []);
    } catch (err) {
      setError("Unable to load pre-orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateOrder = async (order, changes) => {
    setUpdatingId(order.id);
    const previous = orders;
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...changes } : o)));
    try {
      await base44.entities.PreOrder.update(order.id, changes);
    } catch (err) {
      setOrders(previous);
      alert("Failed to update the order. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteOrder = async (order) => {
    const label = order.buyer_name ? `the pre-order from ${order.buyer_name}` : "this pre-order";
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    setUpdatingId(order.id);
    try {
      await base44.entities.PreOrder.delete(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch (err) {
      alert("Failed to delete the order. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const exportCsv = () => {
    const rows = [
      [
        "Date",
        "Name",
        "Email",
        "Phone",
        "Pick-Up or Delivery",
        "Time Needed",
        "Delivery Address",
        "Where to Leave Food",
        "Items",
        "Total",
        "Paid",
        "Status",
      ],
    ];
    orders.forEach((o) => {
      const items = (o.items || [])
        .map((i) => `${i.quantity}x ${i.name}${i.size ? ` (${i.size})` : ""}`)
        .join("; ");
      rows.push([
        o.created_date ? new Date(o.created_date).toLocaleString() : "",
        o.buyer_name || "",
        o.email || "",
        o.phone || "",
        o.fulfillment === "delivery" ? "Delivery" : "Pick-up",
        o.pickup_time || "",
        o.delivery_address || "",
        o.delivery_instructions || "",
        items,
        Number(o.total || 0).toFixed(2),
        o.paid ? "Yes" : "No",
        o.status || "",
      ]);
    });
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `pre-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalRaised = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pickedUp = orders.filter((o) => o.status === "picked_up").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 bg-[#0b2545] text-white px-5 py-4 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#ff8a9b]" />
                <h1 className="text-base font-bold">Pre-Orders</h1>
              </div>
              <p className="text-[11px] text-white/50 mt-0.5">CWA Local 6143 — Admin View</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => printPreOrderList(sale, orders)}
              disabled={orders.length === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-semibold hover:bg-white/20 transition-colors disabled:opacity-40 disabled:hover:bg-white/10"
            >
              <Printer className="w-3.5 h-3.5" /> Print List
            </button>
            <button
              onClick={exportCsv}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-semibold hover:bg-white/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Inbox} label="Orders" value={orders.length} tint="bg-slate-100 text-slate-600" />
          <StatCard icon={ShoppingBag} label="Submitted" value={orders.filter((o) => o.status === "submitted").length} tint="bg-blue-100 text-blue-600" />
          <StatCard icon={PackageCheck} label="Picked Up" value={pickedUp} tint="bg-green-100 text-green-600" />
          <StatCard icon={DollarSign} label="Order Total" value={money(totalRaised)} tint="bg-amber-100 text-amber-600" />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[#c8102e] rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={load} className="mt-3 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <SaleSettings key={sale?.id || "new"} sale={sale} onSaved={setSale} />

            <div>
              <h2 className="text-sm font-semibold text-[#0b2545] mb-3">Submitted pre-orders</h2>
              {orders.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
                  <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="mt-3 text-sm font-medium text-slate-500">No pre-orders yet.</p>
                </div>
              ) : (
                <OrderList
                  orders={orders}
                  updatingId={updatingId}
                  onStatusChange={(order, status) => updateOrder(order, { status })}
                  onPaidToggle={(order) => updateOrder(order, { paid: !order.paid })}
                  onSaveOrder={(order, changes) => updateOrder(order, changes)}
                  onDeleteOrder={deleteOrder}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}