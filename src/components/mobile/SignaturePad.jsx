import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from "react";
import { Eraser } from "lucide-react";

const SignaturePad = forwardRef((props, ref) => {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPoint = useRef(null);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, rect.width) * ratio;
    canvas.height = Math.max(1, rect.height) * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0b2545";
    ctx.lineWidth = 2.5;
  }, []);

  useImperativeHandle(ref, () => ({
    isEmpty: () => !hasInk,
    toDataURL: () => {
      const canvas = canvasRef.current;
      if (!canvas || !hasInk) return "";
      return canvas.toDataURL("image/png");
    },
    clear: () => clearCanvas(),
  }));

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawingRef.current = true;
    lastPoint.current = getPos(e);
  };

  const draw = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPoint.current = pos;
    if (!hasInk) setHasInk(true);
  };

  const end = () => {
    drawingRef.current = false;
    lastPoint.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  return (
    <div>
      <div className="relative rounded-xl border-2 border-black/10 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-36 block"
          style={{ touchAction: "none" }}
          onMouseDown={start}
          onMouseMove={draw}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={draw}
          onTouchEnd={end}
        />
        {!hasInk && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-slate-300 italic">Sign here</span>
          </div>
        )}
      </div>
      {hasInk && (
        <button
          type="button"
          onClick={clearCanvas}
          className="mt-2 flex items-center gap-1 text-xs font-medium text-[#c8102e]"
        >
          <Eraser className="w-3.5 h-3.5" /> Clear signature
        </button>
      )}
    </div>
  );
});

SignaturePad.displayName = "SignaturePad";
export default SignaturePad;