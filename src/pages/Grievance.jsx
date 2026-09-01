import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/mobile/PageHeader";

const EMPTY = {
  full_name: "",
  email: "",
  job_title: "",
  department: "",
  supervisor_name: "",
  incident_date: "",
  contract_article: "",
  description: "",
};

export default function Grievance() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    base44.auth
      .me()
      .then((u) => {
        if (!active) return;
        setForm((f) => ({
          ...f,
          full_name: u.full_name || "",
          email: u.email || "",
        }));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.entities.Grievance.create({ ...form, status: "submitted" });
      setDone(true);
    } catch (err) {
      setError(err.message || "Could not submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div>
        <PageHeader eyebrow="Members Only" title="Grievance Filed" />
        <div className="px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl bg-white p-8 text-center shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]"
          >
            <CheckCircle2 className="mx-auto w-14 h-14 text-[#c8102e]" />
            <h2 className="mt-4 text-xl font-semibold text-[#0b2545]">
              Your grievance was submitted
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              A Local 6143 steward will review your submission and follow up by
              email. Keep an eye on your inbox for next steps.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="mt-6 h-11 w-full bg-[#0b2545] text-white hover:bg-[#0b2545]/90"
            >
              Back to home
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <PageHeader
        eyebrow="Members Only"
        title="Grievance Form"
        subtitle="Fill out the details below. A steward will review and follow up with you."
      />

      <div className="mb-5 flex items-center gap-2 px-6">
        <ShieldCheck className="w-4 h-4 text-[#c8102e]" />
        <span className="text-xs text-slate-500">
          Visible to Local 6143 officers and stewards only.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 px-6">
        <Field label="Full name" required>
          <Input value={form.full_name} onChange={set("full_name")} required className="h-11" />
        </Field>
        <Field label="Email" required>
          <Input type="email" value={form.email} onChange={set("email")} required className="h-11" />
        </Field>
        <Field label="Job title">
          <Input value={form.job_title} onChange={set("job_title")} className="h-11" />
        </Field>
        <Field label="Department / Work location">
          <Input value={form.department} onChange={set("department")} className="h-11" />
        </Field>
        <Field label="Supervisor name">
          <Input value={form.supervisor_name} onChange={set("supervisor_name")} className="h-11" />
        </Field>
        <Field label="Date of incident">
          <Input type="date" value={form.incident_date} onChange={set("incident_date")} className="h-11" />
        </Field>
        <Field label="Contract article violated">
          <Input value={form.contract_article} onChange={set("contract_article")} placeholder="e.g. Article 9" className="h-11" />
        </Field>
        <Field label="Description of grievance" required>
          <Textarea
            value={form.description}
            onChange={set("description")}
            required
            rows={5}
            placeholder="Describe what happened and the remedy you are requesting."
            className="resize-none"
          />
        </Field>

        {error && (
          <div className="rounded-xl bg-[#c8102e]/10 p-3 text-sm text-[#c8102e]">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full bg-[#c8102e] text-white hover:bg-[#c8102e]/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <FileText className="mr-2 w-4 h-4" /> Submit grievance
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-[#0b2545]">
        {label}
        {required && <span className="text-[#c8102e]"> *</span>}
      </Label>
      {children}
    </div>
  );
}