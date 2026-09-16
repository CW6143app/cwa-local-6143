import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import SheetSelect from "@/components/mobile/SheetSelect";

const STATUS_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "Active", label: "Active" },
  { value: "Member - Active - Active", label: "Member - Active - Active" },
  { value: "Member - Active - Suspended", label: "Member - Active - Suspended" },
  { value: "Retired", label: "Retired" }
];

const FIELDS = [
  { key: "first_name", label: "First Name", type: "text" },
  { key: "last_name", label: "Last Name", type: "text" },
  { key: "job_title", label: "Job Title", type: "text" },
  { key: "ncs_date", label: "NCS Date", type: "date" },
  {
    key: "vp_group",
    label: "VP Group",
    type: "select",
    options: [1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `VP ${n}` }))
  },
  { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { key: "processing_unit", label: "Processing Unit", type: "text" },
  { key: "building_city", label: "Building City", type: "text" },
  { key: "notes", label: "Notes", type: "textarea" }
];

export default function EditRosterMember({ open, member, onClose, onSave }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (member) {
      const init = {};
      FIELDS.forEach((f) => {
        init[f.key] = member[f.key] == null ? "" : String(member[f.key]);
      });
      setForm(init);
      setError("");
    }
  }, [member, open]);

  if (!form) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {};
      FIELDS.forEach((f) => {
        let v = form[f.key];
        if (v === "" || v == null) {
          payload[f.key] = f.type === "date" ? null : f.key === "vp_group" ? null : "";
        } else if (f.key === "vp_group") {
          const n = Number(v);
          payload[f.key] = Number.isNaN(n) ? null : n;
        } else {
          payload[f.key] = v;
        }
      });
      await onSave(member.id, payload);
      onClose();
    } catch (err) {
      setError(err.message || "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Roster Member</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.type === "textarea" ? "col-span-2" : "space-y-1"}>
              <Label className="text-xs font-medium text-[#0b2545]">{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  value={form[f.key]}
                  onChange={set(f.key)}
                  rows={3}
                  className="resize-none"
                />
              ) : f.type === "select" ? (
                <SheetSelect
                  value={form[f.key]}
                  onValueChange={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                  options={
                    form[f.key] && !f.options.some((o) => o.value === form[f.key])
                      ? [{ value: form[f.key], label: form[f.key] }, ...f.options]
                      : f.options
                  }
                  placeholder={`Select ${f.label}`}
                  label={`Select ${f.label}`}
                />
              ) : (
                <Input
                  type={f.type}
                  value={form[f.key]}
                  onChange={set(f.key)}
                  className="h-9"
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-lg bg-[#c8102e]/10 px-3 py-2 text-sm text-[#c8102e]">{error}</div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#c8102e] text-white hover:bg-[#c8102e]/90"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}