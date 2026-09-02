import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Lightbulb } from "lucide-react";

const EMPTY = {
  first_name: "",
  last_name: "",
  job_title: "",
  contact_number: "",
  problem_description: "",
  potential_solutions: "",
};

function Field({ label, required, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-[#0b2545]">
        {label}
        {required && <span className="text-[#c8102e]"> *</span>}
      </Label>
      {children}
    </div>
  );
}

export default function PmeiForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.entities.PmeiSubmission.create({ ...form, status: "submitted" });
      setDone(true);
    } catch (err) {
      setError(err.message || "Could not submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="px-6 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white p-8 text-center shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]"
        >
          <CheckCircle2 className="mx-auto w-14 h-14 text-[#c8102e]" />
          <h2 className="mt-4 text-xl font-semibold text-[#0b2545]">Suggestion Submitted</h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Your PMEI suggestion has been submitted to Local 6143. Thank you for your input.
          </p>
          <Button onClick={() => navigate("/resources")} className="mt-6 h-11 w-full bg-[#0b2545] text-white hover:bg-[#0b2545]/90">
            Back to Resources
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-6 pt-10 pb-6 bg-[#b31414]">
        <div className="flex items-center gap-4">
          <img
            src="https://cwa6143.org/sites/default/files/styles/logo/public/logos/cwa-logo-80x38_5.png.webp?itok=wTtU3j7j"
            alt="CWA"
            className="h-10 w-auto brightness-0 invert"
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">ATT SW / CWA</p>
            <h1 className="text-xl font-semibold text-white leading-tight">PMEI Suggestion Form</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-5 pt-6 space-y-5">
        {/* Personal Info */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_8px_24px_-12px_rgba(11,37,69,0.2)] space-y-4">
          <div className="flex gap-3">
            <Field label="First Name" required>
              <Input value={form.first_name} onChange={set("first_name")} required className="h-9" placeholder="First name" />
            </Field>
            <Field label="Last Name" required>
              <Input value={form.last_name} onChange={set("last_name")} required className="h-9" placeholder="Last name" />
            </Field>
          </div>
          <Field label="Job Title">
            <Input value={form.job_title} onChange={set("job_title")} className="h-9" placeholder="Your job title" />
          </Field>
          <Field label="Contact #">
            <Input value={form.contact_number} onChange={set("contact_number")} type="tel" className="h-9" placeholder="Phone number" />
          </Field>
        </div>

        {/* Problem */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_8px_24px_-12px_rgba(11,37,69,0.2)] space-y-3">
          <Field label="Describe a problem or situation" required>
            <Textarea
              value={form.problem_description}
              onChange={set("problem_description")}
              required
              rows={5}
              placeholder="Describe the problem or situation in detail..."
              className="resize-none"
            />
          </Field>
        </div>

        {/* Solutions */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_8px_24px_-12px_rgba(11,37,69,0.2)] space-y-3">
          <Field label="Potential Solutions">
            <Textarea
              value={form.potential_solutions}
              onChange={set("potential_solutions")}
              rows={5}
              placeholder="What solutions would you suggest?"
              className="resize-none"
            />
          </Field>
        </div>

        {error && (
          <div className="rounded-xl bg-[#c8102e]/10 p-3 text-sm text-[#c8102e]">{error}</div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full bg-[#c8102e] text-white hover:bg-[#c8102e]/90 text-sm font-semibold"
        >
          {loading ? (
            <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Submitting…</>
          ) : (
            <><Lightbulb className="mr-2 w-4 h-4" /> Submit Suggestion</>
          )}
        </Button>
      </form>
    </div>
  );
}