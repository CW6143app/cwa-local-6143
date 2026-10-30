import React from "react";
import { Store, Truck } from "lucide-react";

const OPTIONS = [
  { value: "pickup", label: "Pick-Up", icon: Store },
  { value: "delivery", label: "Delivery", icon: Truck },
];

export default function FulfillmentToggle({ value, onChange }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-[#0b2545]">
        Pick-up or delivery<span className="text-[#c8102e]"> *</span>
      </p>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(({ value: option, label, icon: Icon }) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${
                active
                  ? "bg-[#c8102e] text-white"
                  : "border border-black/10 text-[#0b2545] hover:bg-black/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}