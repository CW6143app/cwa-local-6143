import { base44 } from "@/api/base44Client";

// The printable pre-order ticket is built on the server so the emailed copy and
// the downloaded copy are always the same document.
async function downloadPreOrderPdf(orderId) {
  const res = await base44.functions.invoke("preOrderPdf", { orderId });
  if (res.data?.error) throw new Error(res.data.error);

  const binary = atob(res.data.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = res.data.filename || "pre-order.pdf";
  link.click();
  URL.revokeObjectURL(url);
}

export { downloadPreOrderPdf };