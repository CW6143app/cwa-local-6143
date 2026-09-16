import React, { useState } from "react";
import { X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SheetSelect from "@/components/mobile/SheetSelect";

const FIELD_OPTIONS = [
  { value: "vp_group", label: "VP Group" },
  { value: "status", label: "Member Status" },
  { value: "processing_unit", label: "Processing Unit" }
];

const VP_OPTIONS = [1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `VP ${n}` }));

const STATUS_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "Active", label: "Active" },
  { value: "Member - Active - Active", label: "Member - Active - Active" },
  { value: "Member - Active - Suspended", label: "Member - Active - Suspended" },
  { value: "Retired", label: "Retired" }
];

export default function BulkEditBar({ selectedCount, onApply, onClear, onSelectAll, total }) {
  const [field, setField] = useState("vp_group");
  const [value, setValue] = useState("");
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async () => {
    if (value === "" || value == null) {
      setError("Enter a value to apply.");
      return;
    }
    setApplying(true);
    setError("");
    try {
      await onApply(field, field === "vp_group" ? Number(value) : value);
      setValue("");
    } catch (err) {
      setError(err.message || "Could not apply changes.");
    } finally {
      setApplying(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.15)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#c8102e] px-2 text-xs font-bold text-white">
            {selectedCount}
          </span>
          <span className="text-sm font-semibold text-slate-900">selected</span>
          <button
            onClick={onSelectAll}
            className="ml-1 text-xs font-medium text-[#0b2545] underline hover:no-underline"
          >
            {selectedCount === total ? "Clear all" : "Select all"}
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <span className="text-xs font-medium text-slate-500">Set</span>
          <SheetSelect
            value={field}
            onValueChange={(v) => { setField(v); setValue(""); }}
            options={FIELD_OPTIONS}
            label="Field to update"
          />
          <span className="text-xs font-medium text-slate-500">to</span>
          {field === "vp_group" ? (
            <SheetSelect
              value={value}
              onValueChange={setValue}
              options={VP_OPTIONS}
              placeholder="Select VP"
              label="VP Group"
            />
          ) : field === "status" ? (
            <SheetSelect
              value={value}
              onValueChange={setValue}
              options={STATUS_OPTIONS}
              placeholder="Select status"
              label="Member Status"
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 0008001 ATT / SOUTH WESTERN BELL"
              className="h-9 w-56"
            />
          )}
          <Button
            onClick={handleApply}
            disabled={applying || value === ""}
            className="h-9 bg-[#c8102e] text-white hover:bg-[#c8102e]/90"
          >
            {applying ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Check className="w-4 h-4 mr-1.5" />}
            Apply
          </Button>
          <button
            onClick={onClear}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/5 text-slate-600 hover:bg-black/10 transition-colors"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="w-full rounded-lg bg-[#c8102e]/10 px-3 py-1.5 text-xs text-[#c8102e]">{error}</div>
        )}
      </div>
    </div>
  );
}