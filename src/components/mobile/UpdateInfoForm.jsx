import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, UserCog } from "lucide-react";

const EMPTY = {
  full_name: "",
  email: "",
  phone: "",
  address: ""
};

export default function UpdateInfoForm() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.auth.me().then((u) => {
      setForm((f) => ({
        ...f,
        full_name: u.full_name || "",
        email: u.email || ""
      }));
    }).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.entities.MemberInfo.create(form);
      setDone(true);
    } catch (err) {
      setError(err.message || "Could not save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-white p-8 text-center shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]"
      >
        <CheckCircle2 className="mx-auto w-14 h-14 text-[#c8102e]" />
        <h2 className="mt-4 text-xl font-semibold text-[#0b2545]">Information Saved</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Your contact information has been updated with Local 6143.
        </p>
        <Button
          onClick={() => {
            setDone(false);
            setForm(EMPTY);
          }}
          className="mt-6 h-11 w-full bg-[#0b2545] text-white hover:bg-[#0b2545]/90"
        >
          Update again
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_8px_24px_-12px_rgba(11,37,69,0.2)] space-y-4">
        <div className="flex items-center gap-2">
          <UserCog className="w-5 h-5 text-[#c8102e]" />
          <h3 className="text-sm font-semibold text-[#0b2545]">Update Your Contact Info</h3>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-[#0b2545]">
            Full Name <span className="text-[#c8102e]">*</span>
          </Label>
          <Input value={form.full_name} onChange={set("full_name")} required className="h-9" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-[#0b2545]">
            Email <span className="text-[#c8102e]">*</span>
          </Label>
          <Input value={form.email} onChange={set("email")} type="email" required className="h-9" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-[#0b2545]">Phone</Label>
          <Input value={form.phone} onChange={set("phone")} type="tel" className="h-9" placeholder="(555) 123-4567" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-[#0b2545]">Address</Label>
          <Input value={form.address} onChange={set("address")} className="h-9" placeholder="Street, City, State, Zip" />
        </div>

        {error && (
          <div className="rounded-xl bg-[#c8102e]/10 p-3 text-sm text-[#c8102e]">{error}</div>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="h-12 w-full bg-[#c8102e] text-white hover:bg-[#c8102e]/90 text-sm font-semibold"
      >
        {loading ? (
          <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Saving…</>
        ) : (
          "Save Information"
        )}
      </Button>
    </form>
  );
}