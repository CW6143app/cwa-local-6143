import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Home, CalendarDays, BookOpen, Info } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/resources", label: "Resources", icon: BookOpen },
  { to: "/about", label: "About", icon: Info },
];

export default function Shell() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-[#f6f5f2] flex justify-center">
      <div className="w-full max-w-[480px] bg-[#f6f5f2] pb-24 shadow-sm relative dark:bg-[#0a1420]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <Outlet />
        <nav className="fixed bottom-0 w-full max-w-[480px] border-t border-black/10 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a1420]/90" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="grid grid-cols-4">
            {TABS.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className="flex flex-col items-center gap-1 py-3 transition-colors"
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${active ? "text-[#c8102e]" : "text-slate-400"}`}
                    strokeWidth={active ? 2.4 : 1.8}
                  />
                  <span
                    className={`text-[10px] tracking-[0.14em] uppercase ${active ? "text-[#0b2545] font-semibold" : "text-slate-400"}`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}