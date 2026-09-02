import React, { useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("cwa-theme", next ? "dark" : "light");
    } catch (e) {
      /* ignore */
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="absolute top-3 right-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur shadow-sm text-[#0b2545] border border-black/5 dark:bg-white/10 dark:text-slate-100 dark:border-white/10"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}