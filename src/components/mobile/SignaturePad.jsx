import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from "react";
import { Eraser, RotateCw } from "lucide-react";

const SignaturePad = forwardRef((props, ref) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPoint = useRef(null);
  const [hasInk, setHasInk] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inkBackupRef = useRef(null);

  // Detect mobile (touch + small screen) and orientation
  useEffect(() => {
    const check = () => {
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(touch && Math.min(window.innerWidth, window.innerHeight) < 768);
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    check();
    const handler = () => setTimeout(check, 150);
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', handler);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', handler);
    };
  }, []);

  const canvasVisible = !isMobile || isLandscape;
  const showRotatePrompt = isMobile && !isLandscape;

  // Resize canvas resolution to match CSS container dimensions, preserving ink
  const resizeCanvas = (canvas) => {
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const targetW = Math.max(1, Math.round(rect.width * ratio));
    const targetH = Math.max(1, Math.round(rect.height * ratio));
    // Preserve current ink before resizing
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

  // Setup canvas whenever it becomes visible + observe container resizes
  useEffect(() => {
    if (!canvasVisible) return;
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
  }, [canvasVisible]);

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

  // Attach native non-passive touch listeners so preventDefault reliably stops scrolling
  useEffect(() => {
    if (!canvasVisible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const opts = { passive: false };
    const tStart = (e) => start(e);
    const tMove = (e) => draw(e);
    const tEnd = (e) => end(e);
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
  }, [canvasVisible, hasInk]);

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
    <div ref={containerRef}>
      {showRotatePrompt ? (
        <div>
          {hasInk && inkBackupRef.current && (
            <div className="mb-3 relative rounded-xl border-2 border-black/10 bg-white overflow-hidden">
              <img src={inkBackupRef.current} alt="Your signature" className="w-full h-20 object-contain" />
              <button
                type="button"
                onClick={clearCanvas}
                className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-[#c8102e] shadow-sm"
              >
                <Eraser className="w-3 h-3" /> Clear
              </button>
            </div>
          )}
          <div className="rounded-xl border-2 border-dashed border-[#c8102e]/30 bg-[#c8102e]/5 p-8 text-center">
            <RotateCw className="mx-auto w-10 h-10 text-[#c8102e]" />
            <p className="mt-3 text-sm font-semibold text-[#0b2545]">
              {hasInk ? "Turn sideways to edit signature" : "Turn your phone sideways to sign"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Rotate to landscape for a full-screen signing area</p>
          </div>
        </div>
      ) : isMobile && isLandscape ? (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 shrink-0">
            <span className="text-sm font-semibold text-[#0b2545]">Sign your full signature below</span>
            {hasInk && (
              <button type="button" onClick={clearCanvas} className="flex items-center gap-1 text-xs font-medium text-[#c8102e]">
                <Eraser className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
          <div className="flex-1 relative">
            <canvas ref={canvasRef} {...canvasProps} className="w-full h-full block" />
            {!hasInk && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-base text-slate-300 italic">Sign here</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="relative rounded-xl border-2 border-black/10 bg-white overflow-hidden">
            <canvas ref={canvasRef} {...canvasProps} className="w-full h-36 block" />
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
      )}
    </div>
  );
});

SignaturePad.displayName = "SignaturePad";
export default SignaturePad;