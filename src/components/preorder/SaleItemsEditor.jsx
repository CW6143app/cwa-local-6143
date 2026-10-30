import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

const toText = (items) =>
  items
    .map((i) => [i.name, i.price, i.sizes].filter((v) => v !== "" && v !== undefined && v !== null).join(" | "))
    .join("\n");

const parse = (text) =>
  text
    .split("\n")
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      let name = parts[0] || "";
      let price = parts[1] || "";
      const sizes = parts[2] || "";
      if (parts.length === 1) {
        const match = name.match(/^(.*?)[\s,\-–—]*\$?(\d+(?:\.\d{1,2})?)$/);
        if (match) {
          name = match[1].trim();
          price = match[2];
        }
      }
      return { name, price: price.replace(/[^0-9.]/g, ""), sizes };
    })
    .filter((item) => item.name);

export default function SaleItemsEditor({ items, onChange }) {
  const [text, setText] = useState(() => toText(items));

  const handleChange = (value) => {
    setText(value);
    onChange(parse(value));
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        rows={5}
        placeholder={"BBQ Plate | 12\nLocal 6143 T-Shirt | 20 | S, M, L, XL\nExtra Side | 4"}
        className="resize-y text-xs"
      />
      <p className="text-[11px] leading-relaxed text-slate-500">
        One item per line: <span className="font-medium text-[#0b2545]">name | price | sizes</span> — sizes only if
        the item has them.
      </p>
      {items.length > 0 && (
        <ul className="rounded-xl bg-black/5 p-3 space-y-1">
          {items.map((item, index) => (
            <li key={index} className="flex justify-between gap-3 text-xs text-[#0b2545]">
              <span>
                {item.name}
                {item.sizes ? ` (${item.sizes})` : ""}
              </span>
              <span className="font-semibold">${Number(item.price || 0).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}