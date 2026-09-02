import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import PageHeader from "@/components/mobile/PageHeader";
import { base44 } from "@/api/base44Client";

const COMMITTEES = [
  "Legislative Committee",
  "Safety Committee",
  "Organizing Committee",
  "Education Committee",
  "Membership Committee",
  "Bylaws Committee",
  "Finance Committee",
  "Community Services/Activities Committee",
  "Civil Rights and Equity Committee",
  "Women's Committee",
  "Building Committee",
  "Election Committee",
];

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#0b2545] placeholder:text-slate-400 focus:border-[#c8102e] focus:outline-none focus:ring-2 focus:ring-[#c8102e]/20";

export default function CommitteeSignup() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    committee: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleCommittee = (c) =>
    setForm((f) => ({
      ...f,
      committee: f.committee.includes(c)
        ? f.committee.filter((x) => x !== c)
        : [...f.committee, c],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.first_name || !form.last_name || !form.email || form.committee.length === 0) {
      setError("Please fill in all required fields and pick at least one committee.");
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.CommitteeSignup.create(form);
      setDone(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="px-6 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl bg-white p-8 text-center shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-[#0b2545]">
            You're signed up!
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Thanks for volunteering for {form.committee.join(", ")}. A member of the
            Local will reach out to you soon.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Get Involved"
        title="Committee Sign Up"
        subtitle="Volunteer for a Local 6143 committee and help build a stronger union."
      />
      <form onSubmit={submit} className="space-y-4 px-6 pb-8">
        <div className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)] space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0b2545]">
                First Name *
              </label>
              <input
                className={inputClass}
                value={form.first_name}
                onChange={(e) => update("first_name", e.target.value)}
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0b2545]">
                Last Name *
              </label>
              <input
                className={inputClass}
                value={form.last_name}
                onChange={(e) => update("last_name", e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#0b2545]">
              Email *
            </label>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="jane@email.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#0b2545]">
              Phone
            </label>
            <input
              type="tel"
              className={inputClass}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="(210) 555-0100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#0b2545]">
              Committees * <span className="font-normal text-slate-400">(select all that apply)</span>
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {COMMITTEES.map((c) => {
                const checked = form.committee.includes(c);
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggleCommittee(c)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                      checked
                        ? "border-[#c8102e] bg-[#c8102e]/5 text-[#0b2545]"
                        : "border-black/10 bg-white text-[#0b2545] hover:border-black/20"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked ? "border-[#c8102e] bg-[#c8102e]" : "border-black/20 bg-white"
                      }`}
                    >
                      {checked && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                    </span>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-4 py-3 text-sm font-semibold text-white hover:bg-[#a50d24] disabled:opacity-60 transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Submitting…" : "Sign Up"}
          </button>
        </div>
      </form>
    </div>
  );
}