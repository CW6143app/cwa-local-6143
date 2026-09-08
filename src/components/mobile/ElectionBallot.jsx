import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Mail, Phone, MapPin, User, Loader2, Vote, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const NOMINATIONS = [
  { office: "President", nominees: [] },
  { office: "Executive Vice President", nominees: [] },
  { office: "Secretary/Treasurer", nominees: [] },
  { office: "Vice President 1", nominees: [] },
  { office: "Core Chief Steward", nominees: [] },
  { office: "App. J Chief Steward", nominees: [] },
  { office: "Vice President 2", nominees: [] },
  { office: "Chief Steward", nominees: [] },
  { office: "Vice President 3", nominees: [] },
  { office: "Retail Chief Steward", nominees: [] },
  { office: "Call Center Chief Steward", nominees: [] },
];

export default function ElectionBallot() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("nominations"); // nominations | form | done
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitElectionBallot", form);
      if (res?.data?.error) throw new Error(res.data.error);
      setStep("done");
    } catch (err) {
      toast({ title: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setOpen(false);
    setStep("nominations");
    setForm({ name: "", email: "", phone: "", address: "" });
  };

  return (
    <div>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#c8102e] px-5 py-4 text-white shadow-[0_8px_24px_-12px_rgba(200,16,46,0.6)]"
      >
        <Vote className="w-5 h-5" />
        <span className="text-sm font-bold uppercase tracking-[0.18em]">Local Election 2026</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4"
            onClick={reset}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
              <AnimatePresence mode="wait">
                {/* Step: Nominations */}
                {step === "nominations" && (
                  <motion.div
                    key="nominations"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#c8102e]/10">
                        <Vote className="h-6 w-6 text-[#c8102e]" />
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-[#0b2545]">
                        Local Election 2026 — Nominations
                      </h3>
                    </div>

                    <ul className="mt-5 space-y-3">
                      {NOMINATIONS.map((n) => (
                        <li key={n.office} className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                          <p className="text-sm font-bold text-[#0b2545]">{n.office}</p>
                          {n.nominees.length > 0 ? (
                            <ul className="mt-1 space-y-0.5">
                              {n.nominees.map((name) => (
                                <li key={name} className="text-sm text-slate-700 leading-relaxed">
                                  {name}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1 text-xs italic text-slate-400">—</p>
                          )}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => setStep("form")}
                      className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-[#c8102e] py-3 text-sm font-semibold text-white"
                    >
                      Click Here If You Have Not Received Your Ballot
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className="mt-2 w-full text-xs text-slate-400 hover:text-slate-600"
                    >
                      Close
                    </button>
                  </motion.div>
                )}

                {/* Step: Contact form */}
                {step === "form" && (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-[#0b2545]">Update your contact info</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        We'll make sure you receive your ballot for Local Election 2026.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="el-name" className="text-xs text-slate-600">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input id="el-name" value={form.name} onChange={update("name")} required className="pl-9" placeholder="Jane Member" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="el-email" className="text-xs text-slate-600">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input id="el-email" type="email" value={form.email} onChange={update("email")} required className="pl-9" placeholder="you@email.com" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="el-phone" className="text-xs text-slate-600">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input id="el-phone" value={form.phone} onChange={update("phone")} className="pl-9" placeholder="(210) 555-0123" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="el-address" className="text-xs text-slate-600">Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input id="el-address" value={form.address} onChange={update("address")} className="pl-9" placeholder="123 Main St, San Antonio, TX" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#c8102e] py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {submitting ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                      ) : (
                        "Submit to Election Committee"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("nominations")}
                      className="w-full text-xs text-slate-400 hover:text-slate-600"
                    >
                      Back
                    </button>
                  </motion.form>
                )}

                {/* Step: Done */}
                {step === "done" && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="text-center"
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#13653f]/10">
                      <CheckCircle2 className="h-7 w-7 text-[#13653f]" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-[#0b2545]">Submitted</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Your information has been sent to the CWA Local 6143 Election Committee. We'll be in touch to make sure you receive your ballot.
                    </p>
                    <button
                      onClick={reset}
                      className="mt-6 w-full rounded-xl bg-[#c8102e] py-3 text-sm font-semibold text-white"
                    >
                      Close
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}