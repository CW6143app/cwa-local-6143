import React, { useState, useEffect, useRef } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

export default function AddressAutocomplete({
  value,
  onChange,
  onSelectAddress,
  placeholder,
  className = "",
  ...rest
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = async (text) => {
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("addressAutocomplete", { input: text });
      setSuggestions(res.data?.predictions || []);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    onChange(e);
    clearTimeout(timer.current);
    const text = e.target.value;
    timer.current = setTimeout(() => fetchSuggestions(text), 300);
  };

  const handleSelect = async (s) => {
    setOpen(false);
    setSuggestions([]);
    try {
      const res = await base44.functions.invoke("addressAutocomplete", { placeId: s.placeId });
      const data = res.data || {};
      if (onSelectAddress) {
        onSelectAddress(data);
      } else {
        onChange({ target: { value: data.formatted || s.description } });
      }
    } catch {
      if (onSelectAddress) {
        onSelectAddress({ formatted: s.description, street: s.description });
      } else {
        onChange({ target: { value: s.description } });
      }
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Input
          {...rest}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-black/10 bg-white shadow-lg">
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              onClick={() => handleSelect(s)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs text-[#0b2545] hover:bg-black/5"
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c8102e]" />
              <span>{s.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}