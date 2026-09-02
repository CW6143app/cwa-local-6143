import React, { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SheetSelect({ value, onValueChange, options, placeholder, label, disabled }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
      >
        <span className={cn(!selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder || "Select..."}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-w-[480px] mx-auto rounded-t-2xl">
          {label && (
            <DrawerHeader className="text-center">
              <DrawerTitle>{label}</DrawerTitle>
            </DrawerHeader>
          )}
          <div className="px-4 pb-8 space-y-1 max-h-[60vh] overflow-y-auto">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onValueChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-medium transition-colors",
                  value === o.value
                    ? "bg-[#c8102e]/10 text-[#c8102e]"
                    : "hover:bg-slate-100 text-slate-700"
                )}
              >
                {o.label}
                {value === o.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}