import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, FileText } from "lucide-react";
import SheetSelect from "@/components/mobile/SheetSelect";

const INCIDENT_TYPES = ["PN", "WR", "DML", "Susp/Term", "Other"];

const EMPTY = {
  local_grievance_num: "",
  name_of_grievant: "",
  ncs: "",
  home_address: "",
  cell: "",
  city: "",
  zip: "",
  last4_ssn: "",
  gender: "",
  email: "",
  job_title: "",
  department: "",
  suits_id: "",
  work_location: "",
  first_level_mgr: "",
  date_of_incident: "",
  incident_type: [],
  explain_other: "",
  explain_grievance: "",
  settlement_expected: "",
  violation_of_articles: "",
  auth_personal_records: false,
  auth_medical_records: false,
  signature_date: ""
};

function Row({ children, className = "" }) {
  return <div className={`flex gap-3 flex-wrap ${className}`}>{children}</div>;
}

function Field({ label, flex = "1", required, children }) {
  return (
    <div className="space-y-1" style={{ flex }}>
      <Label className="text-xs font-medium text-[#0b2545]">
        {label}
        {required && <span className="text-[#c8102e]"> *</span>}
      </Label>
      {children}
    </div>);

}

function SectionTitle({ num, label }) {
  return (
    <div className="flex items-start gap-2 mt-1">
      <span className="text-sm font-semibold text-[#0b2545] shrink-0 w-5">{num}.</span>
      <span className="text-sm font-semibold text-[#0b2545]">{label}</span>
    </div>);

}

function Divider() {
  return <div className="border-t border-black/8 my-1" />;
}

export default function Grievance() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.auth.me().then((u) => {
      setForm((f) => ({
        ...f,
        name_of_grievant: u.full_name || "",
        email: u.email || ""
      }));
    }).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleIncidentType = (type) => {
    setForm((f) => ({
      ...f,
      incident_type: f.incident_type.includes(type) ?
      f.incident_type.filter((t) => t !== type) :
      [...f.incident_type, type]
    }));
  };

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
      <div className="px-6 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white p-8 text-center shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]">
          
          <CheckCircle2 className="mx-auto w-14 h-14 text-[#c8102e]" />
          <h2 className="mt-4 text-xl font-semibold text-[#0b2545]">Grievance Submitted</h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Your grievance has been filed with Local 6143. A steward will follow up with you.
          </p>
          <Button onClick={() => navigate("/")} className="mt-6 h-11 w-full bg-[#0b2545] text-white hover:bg-[#0b2545]/90">
            Back to home
          </Button>
        </motion.div>
      </div>);

  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-6 pt-10 pb-6 opacity-100 bg-[#b31414]">
        <div className="flex items-center gap-4">
          <img
            src="https://cwa6143.org/sites/default/files/styles/logo/public/logos/cwa-logo-80x38_5.png.webp?itok=wTtU3j7j"
            alt="CWA"
            className="h-10 w-auto brightness-0 invert" />
          
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">Local 6143</p>
            <h1 className="text-xl font-semibold text-white leading-tight">Grievance Form</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-5 pt-6 space-y-5">

        {/* Grievance # */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_8px_24px_-12px_rgba(11,37,69,0.2)] space-y-4">
          <Field label="Local Grievance #">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#0b2545]">20</span>
              <span className="text-sm text-slate-400">-</span>
              <Input value={form.local_grievance_num} onChange={set("local_grievance_num")} className="h-9 flex-1" placeholder="___-___" />
            </div>
          </Field>
        </div>

        {/* Fields 1–6 */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_8px_24px_-12px_rgba(11,37,69,0.2)] space-y-4">
          <div>
            <SectionTitle num="1" label="Name of Grievant" />
            <Row className="mt-2">
              <Field label="Full name" flex="2" required>
                <Input value={form.name_of_grievant} onChange={set("name_of_grievant")} required className="h-9" />
              </Field>
              <Field label="NCS" flex="1">
                <Input value={form.ncs} onChange={set("ncs")} className="h-9" />
              </Field>
            </Row>
          </div>
          <Divider />
          <div>
            <SectionTitle num="2" label="Home Address" />
            <Row className="mt-2">
              <Field label="Address" flex="2">
                <Input value={form.home_address} onChange={set("home_address")} className="h-9" />
              </Field>
              <Field label="Cell #" flex="1">
                <Input value={form.cell} onChange={set("cell")} type="tel" className="h-9" />
              </Field>
            </Row>
          </div>
          <Divider />
          <div>
            <SectionTitle num="3" label="City / Zip / SSN" />
            <Row className="mt-2">
              <Field label="City" flex="2">
                <Input value={form.city} onChange={set("city")} className="h-9" />
              </Field>
              <Field label="Zip" flex="1">
                <Input value={form.zip} onChange={set("zip")} className="h-9" />
              </Field>
              <Field label="Last 4 SSN" flex="1">
                <Input value={form.last4_ssn} onChange={set("last4_ssn")} maxLength={4} className="h-9" />
              </Field>
            </Row>
          </div>
          <Divider />
          <div>
            <SectionTitle num="4" label="Gender / Email" />
            <Row className="mt-2">
              <Field label="Gender" flex="1">
                <SheetSelect
                  value={form.gender}
                  onValueChange={(val) => setForm((f) => ({ ...f, gender: val }))}
                  placeholder="Select gender"
                  label="Select Gender"
                  options={[
                    { value: "M", label: "Male" },
                    { value: "F", label: "Female" },
                    { value: "Other", label: "Other" }
                  ]}
                />
              </Field>
              <Field label="Email" flex="2" required>
                <Input value={form.email} onChange={set("email")} type="email" required className="h-9" />
              </Field>
            </Row>
          </div>
          <Divider />
          <div>
            <SectionTitle num="5" label="Job Title / Department / SUITS ID" />
            <Row className="mt-2">
              <Field label="Job Title" flex="2">
                <Input value={form.job_title} onChange={set("job_title")} className="h-9" />
              </Field>
              <Field label="Department" flex="2">
                <Input value={form.department} onChange={set("department")} className="h-9" />
              </Field>
              <Field label="SUITS ID" flex="1">
                <Input value={form.suits_id} onChange={set("suits_id")} className="h-9" />
              </Field>
            </Row>
          </div>
          <Divider />
          <div>
            <SectionTitle num="6" label="Work Location / 1st Level Mgr." />
            <Row className="mt-2">
              <Field label="Work Location" flex="2">
                <Input value={form.work_location} onChange={set("work_location")} className="h-9" />
              </Field>
              <Field label="1st Level Mgr." flex="2">
                <Input value={form.first_level_mgr} onChange={set("first_level_mgr")} className="h-9" />
              </Field>
            </Row>
          </div>
        </div>

        {/* Field 7 */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_8px_24px_-12px_rgba(11,37,69,0.2)] space-y-4">
          <SectionTitle num="7" label="Date of Incident & Type" />
          <Row className="mt-2">
            <Field label="Date of Incident" flex="1">
              <Input value={form.date_of_incident} onChange={set("date_of_incident")} type="date" className="h-9" />
            </Field>
          </Row>
          <div>
            <Label className="text-xs font-medium text-[#0b2545]">Incident Type (select all that apply)</Label>
            <div className="flex flex-wrap gap-3 mt-2">
              {INCIDENT_TYPES.map((t) =>
              <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                  type="checkbox"
                  checked={form.incident_type.includes(t)}
                  onChange={() => toggleIncidentType(t)}
                  className="accent-[#c8102e] w-4 h-4" />
                
                  {t}
                </label>
              )}
            </div>
          </div>
          {form.incident_type.includes("Other") &&
          <Field label="Explain (Other)">
              <Input value={form.explain_other} onChange={set("explain_other")} className="h-9" />
            </Field>
          }
          <Field label="Explain your grievance" required>
            <Textarea
              value={form.explain_grievance}
              onChange={set("explain_grievance")}
              required
              rows={6}
              placeholder="Describe what happened..."
              className="resize-none" />
            
          </Field>
          <Field label="Signature Date">
            <Input value={form.signature_date} onChange={set("signature_date")} type="date" className="h-9" />
          </Field>
        </div>

        {/* Field 8 */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_8px_24px_-12px_rgba(11,37,69,0.2)] space-y-3">
          <SectionTitle num="8" label="What settlement is expected?" />
          <Textarea
            value={form.settlement_expected}
            onChange={set("settlement_expected")}
            rows={3}
            placeholder="Describe the remedy requested..."
            className="resize-none mt-2" />
          
        </div>

        {/* Field 9 */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_8px_24px_-12px_rgba(11,37,69,0.2)] space-y-3">
          <SectionTitle num="9" label="Violation of Article(s) or Past Practice" />
          <Textarea
            value={form.violation_of_articles}
            onChange={set("violation_of_articles")}
            rows={3}
            placeholder="e.g. Article 4: Basis of Compensation..."
            className="resize-none mt-2" />
          
        </div>

        {/* Authorization */}
        <div className="rounded-2xl border-2 border-[#0b2545] bg-white p-5 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_8px_24px_-12px_rgba(11,37,69,0.2)] space-y-3">
          <h3 className="text-sm font-bold text-[#0b2545] text-center">
            Grievant's Authorization to Obtain Personal / Medical Records
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            I do hereby grant permission to the Union to examine, review, and obtain copies where they are necessary,
            of any and all portions of my records maintained by the Company, necessary to process a grievance on my
            behalf. I understand all information and discussions of a personal nature pertaining to these records will
            be held in strict confidence unless otherwise stated by me.
          </p>
          <p className="text-xs font-medium text-[#0b2545]">Permission granted for my:</p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.auth_personal_records}
                onChange={(e) => setForm((f) => ({ ...f, auth_personal_records: e.target.checked }))}
                className="accent-[#c8102e] w-4 h-4" />
              
              Personal Records
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.auth_medical_records}
                onChange={(e) => setForm((f) => ({ ...f, auth_medical_records: e.target.checked }))}
                className="accent-[#c8102e] w-4 h-4" />
              
              Medical Records
            </label>
          </div>
        </div>

        {error &&
        <div className="rounded-xl bg-[#c8102e]/10 p-3 text-sm text-[#c8102e]">{error}</div>
        }

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full bg-[#c8102e] text-white hover:bg-[#c8102e]/90 text-sm font-semibold">
          
          {loading ?
          <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Submitting…</> :

          <><FileText className="mr-2 w-4 h-4" /> Submit Grievance</>
          }
        </Button>
      </form>
    </div>);

}