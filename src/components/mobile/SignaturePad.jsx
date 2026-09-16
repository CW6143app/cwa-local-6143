import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from "react";
import { Eraser } from "lucide-react";

const SignaturePad = forwardRef((props, ref) => {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPoint = useRef(null);
  const [hasInk, setHasInk] = useState(false);
  const inkBackupRef = useRef(null);

  useImperativeHandle(ref, () => ({
    isEmpty: () => !hasInk,
    toDataURL: () => {
      const canvas = canvasRef.current;
      if (canvas && hasInk) return canvas.toDataURL("image/png");
      if (inkBackupRef.current && hasInk) return inkBackupRef.current;
      return "";
    },
    clear: () => clearCanvas(),
  }));

  // Resize canvas resolution to match CSS container, preserving ink
  const resizeCanvas = (canvas) => {
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const targetW = Math.max(1, Math.round(rect.width * ratio));
    const targetH = Math.max(1, Math.round(rect.height * ratio));
    let snap = null;
    if (canvas.width > 0 && canvas.height > 0) {
      try { snap = canvas.toDataURL("image/png"); } catch (e) {}
    } else if (inkBackupRef.current) {
      snap = inkBackupRef.current;
    }
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0b2545";
    ctx.lineWidth = 2.5;
    if (snap) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = snap;
      inkBackupRef.current = snap;
    }
  };

  // Initial setup + observe resizes (works inside installed PWA/native webview)
  useEffect(() => {
    let raf;
    const setup = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) {
        raf = requestAnimationFrame(setup);
        return;
      }
      resizeCanvas(canvas);
    };
    raf = requestAnimationFrame(setup);

    const canvas = canvasRef.current;
    const ro = canvas && 'ResizeObserver' in window ? new ResizeObserver(() => resizeCanvas(canvasRef.current)) : null;
    if (ro && canvas) ro.observe(canvas);
    const onResize = () => resizeCanvas(canvasRef.current);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      const c = canvasRef.current;
      if (c) {
        try { inkBackupRef.current = c.toDataURL("image/png"); } catch (e) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] ?? e.changedTouches?.[0];
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
    const canvas = canvasRef.current;
    if (canvas) {
      try { inkBackupRef.current = canvas.toDataURL("image/png"); } catch (e) {}
    }
  };

  // Native non-passive touch listeners so preventDefault reliably stops scrolling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const opts = { passive: false };
    const tStart = (e) => start(e);
    const tMove = (e) => draw(e);
    const tEnd = () => end();
    canvas.addEventListener('touchstart', tStart, opts);
    canvas.addEventListener('touchmove', tMove, opts);
    canvas.addEventListener('touchend', tEnd, opts);
    canvas.addEventListener('touchcancel', tEnd, opts);
    return () => {
      canvas.removeEventListener('touchstart', tStart);
      canvas.removeEventListener('touchmove', tMove);
      canvas.removeEventListener('touchend', tEnd);
      canvas.removeEventListener('touchcancel', tEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInk]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    inkBackupRef.current = null;
    setHasInk(false);
  };

  const canvasProps = {
    style: { touchAction: "none", WebkitUserSelect: "none", userSelect: "none" },
    onMouseDown: start,
    onMouseMove: draw,
    onMouseUp: end,
    onMouseLeave: end,
  };

  return (
    <div>
      <div className="relative rounded-xl border-2 border-black/10 bg-white overflow-hidden">
        <canvas ref={canvasRef} {...canvasProps} className="w-full h-40 block" />
        {!hasInk && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-slate-300 italic">Sign here</span>
          </div>
        )}
      </div>
      {hasInk && (
        <button type="button" onClick={clearCanvas} className="mt-2 flex items-center gap-1 text-xs font-medium text-[#c8102e]">
          <Eraser className="w-3.5 h-3.5" /> Clear signature
        </button>
      )}
    </div>
  );
});

SignaturePad.displayName = "SignaturePad";
export default SignaturePad;