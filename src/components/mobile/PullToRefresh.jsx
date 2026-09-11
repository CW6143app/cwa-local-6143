import React, { useState, useRef } from "react";
import { Loader2, RotateCw } from "lucide-react";

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pulling = useRef(false);

  const onTouchStart = (e) => {
    if (refreshing) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = false;
  };

  const onTouchMove = (e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) {
      if (pulling.current) {
        setPull(0);
        pulling.current = false;
      }
      return;
    }
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 0) {
      startY.current = null;
      return;
    }
    pulling.current = true;
    setPull(Math.min(delta * 0.5, 100));
  };

  const onTouchEnd = async () => {
    if (startY.current === null) return;
    startY.current = null;
    if (pulling.current && pull >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
    pulling.current = false;
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        style={{
          height: refreshing ? THRESHOLD : pull,
          transition: startY.current === null ? "height 0.3s ease" : "none",
        }}
        className="flex items-center justify-center overflow-hidden"
      >
        {refreshing ? (
          <Loader2 className="w-6 h-6 animate-spin text-[#c8102e]" />
        ) : pull > 10 ? (
          <RotateCw
            className="w-6 h-6 text-[#c8102e]"
            style={{ transform: `rotate(${pull * 3}deg)` }}
          />
        ) : null}
      </div>
      {children}
    </div>
  );
}