import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Settings, Trash2, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

export default function AccountSettings() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  if (!user) return null;

  const handleDelete = async () => {
    setDeleting(true);
    // Mock API deletion request
    await new Promise((r) => setTimeout(r, 1500));
    setDeleting(false);
    setDone(true);
  };

  const reset = () => {
    setDone(false);
    setOpen(false);
    setConfirmText("");
  };

  return (
    <>
      <div className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#c8102e]" />
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c8102e]">
            Account Settings
          </h2>
        </div>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          Signed in as <span className="font-semibold text-[#0b2545]">{user.email}</span>
        </p>
        <button
          onClick={() => setOpen(true)}
          className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 w-full hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>

      <Drawer open={open} onOpenChange={(v) => { if (!v) reset(); else setOpen(v); }}>
        <DrawerContent className="max-w-[480px] mx-auto rounded-t-2xl">
          {done ? (
            <div className="px-6 py-10 text-center">
              <CheckCircle2 className="mx-auto w-12 h-12 text-green-500" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">Deletion Requested</h3>
              <p className="mt-2 text-sm text-slate-500">
                Your account deletion request has been submitted. You will be contacted within 30 days.
              </p>
              <Button onClick={reset} className="mt-6 w-full bg-[#0b2545] text-white hover:bg-[#0b2545]/90">
                Close
              </Button>
            </div>
          ) : (
            <>
              <DrawerHeader className="text-center">
                <DrawerTitle className="text-red-600">Delete Account?</DrawerTitle>
                <DrawerDescription>
                  This will permanently remove your account and all associated data. This action cannot be undone.
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-6 pb-8 space-y-4">
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold">Warning</p>
                    <p className="mt-1">All grievance history, contact info, and membership data will be lost.</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="mt-2 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="DELETE"
                  />
                </div>
                <Button
                  onClick={handleDelete}
                  disabled={confirmText !== "DELETE" || deleting}
                  className="w-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? (
                    <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Deleting…</>
                  ) : (
                    <><Trash2 className="mr-2 w-4 h-4" /> Permanently Delete</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}