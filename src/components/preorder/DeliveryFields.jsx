import React from "react";
import { MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AddressAutocomplete from "@/components/mobile/AddressAutocomplete";

export default function DeliveryFields({ address, instructions, onAddressChange, onInstructionsChange }) {
  return (
    <div className="space-y-3 border-t border-black/10 pt-4">
      <div className="space-y-1.5">
        <Label htmlFor="delivery-address" className="flex items-center gap-1.5 text-xs font-medium text-[#0b2545]">
          <MapPin className="h-3.5 w-3.5 text-[#c8102e]" />
          Delivery address<span className="text-[#c8102e]"> *</span>
        </Label>
        <AddressAutocomplete
          id="delivery-address"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          onSelectAddress={(data) => onAddressChange(data.formatted || "")}
          placeholder="Street, city, state, zip"
          className="h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="delivery-instructions" className="text-xs font-medium text-[#0b2545]">
          Where should we put the food?
        </Label>
        <Textarea
          id="delivery-instructions"
          value={instructions}
          onChange={(e) => onInstructionsChange(e.target.value)}
          rows={2}
          placeholder="Front porch, side door, leave with the front desk…"
          className="resize-none"
        />
      </div>
    </div>
  );
}