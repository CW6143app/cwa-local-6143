import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

function getComponent(components: any[], ...types: string[]): string {
  for (const t of types) {
    const c = components.find((c) => c.types?.includes(t));
    if (c) return c.longText || c.shortText || "";
  }
  return "";
}

export default async function (req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({} as any));
    const apiKey = secrets.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) return Response.json({ error: "Missing Maps API key" }, { status: 500 });

    const placeId = body.placeId;
    const input = String(body.input || "").slice(0, 200);

    if (placeId) {
      const id = encodeURIComponent(String(placeId).replace(/^places\//, ""));
      const url = `https://places.googleapis.com/v1/places/${id}`;
      const res = await fetch(url, {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "addressComponents,formattedAddress",
        },
      });
      const data: any = await res.json();
      if (!res.ok) return Response.json({ error: data.error?.message || "Place details failed" }, { status: 502 });
      const comps: any[] = data.addressComponents || [];
      const street = [getComponent(comps, "street_number"), getComponent(comps, "route")].filter(Boolean).join(" ");
      return Response.json({
        formatted: data.formattedAddress || "",
        street,
        city: getComponent(comps, "locality", "postal_town", "sublocality"),
        state: getComponent(comps, "administrative_area_level_1"),
        zip: getComponent(comps, "postal_code"),
      });
    }

    if (!input || input.length < 3) return Response.json({ predictions: [] });
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text",
      },
      body: JSON.stringify({ input }),
    });
    const data: any = await res.json();
    if (!res.ok) return Response.json({ error: data.error?.message || "Autocomplete failed" }, { status: 502 });
    const predictions = (data.suggestions || [])
      .filter((s: any) => s.placePrediction)
      .map((s: any) => ({
        placeId: s.placePrediction.placeId || s.placePrediction.place,
        description: s.placePrediction.text?.text || "",
      }));
    return Response.json({ predictions });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}