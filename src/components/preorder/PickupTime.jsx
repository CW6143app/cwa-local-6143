import React from "react";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PickupTime({ value, onChange, mode = "pickup" }) {
  const isDelivery = mode === "delivery";
  return (
    <div className="space-y-1.5 border-t border-black/10 pt-4">
      <Label htmlFor="pickup-time" className="flex items-center gap-1.5 text-xs font-medium text-[#0b2545]">
        <Clock className="h-3.5 w-3.5 text-[#c8102e]" />
        {isDelivery ? "Delivery time" : "Pick-up time"}<span className="text-[#c8102e]"> *</span>
      </Label>
      <Input
        id="pickup-time"
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="h-11"
      />
      <p className="text-[11px] text-slate-500">
        {isDelivery ? "What time do you need the food delivered?" : "What time do you need your food by?"}
      </p>
    </div>
  );
}