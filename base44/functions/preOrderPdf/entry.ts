import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { preOrderFileName, preOrderPdfBytes, toBase64 } from "../../shared/preOrderPdf.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({} as any));
    const orderId = String(body.orderId || "").trim();
    if (!orderId) return Response.json({ error: "Order not specified." }, { status: 400 });

    const order = await base44.asServiceRole.entities.PreOrder
      .get(orderId)
      .catch((e: any) => (e.status === 404 ? null : Promise.reject(e)));
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });

    const sale = order.sale_id
      ? await base44.asServiceRole.entities.PreOrderSale.get(order.sale_id).catch(() => null)
      : null;

    const bytes = preOrderPdfBytes(order, sale || {});
    return Response.json({ filename: preOrderFileName(order), base64: toBase64(bytes) });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}