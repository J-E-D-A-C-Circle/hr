"use client";

import React, { useRef, useState, useEffect } from "react";
import { PenTool, RotateCcw, Check, Stamp, X } from "lucide-react";
import { Button } from "./ui/Button";

interface SignaturePadProps {
  onSaveSignature: (dataUrl: string) => void;
  onClose: () => void;
  signatoryName?: string;
  signatoryTitle?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSaveSignature,
  onClose,
  signatoryName = "EPHRAIM NII TAN SACKEY",
  signatoryTitle = "AG. DIRECTOR, HUMAN RESOURCE",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e40af"; // Deep blue ink
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSaveSignature(dataUrl);
  };

  const generateStampSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw official seal/stamp
    ctx.save();
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#1e3a8a";
    ctx.fillText("DIGITALLY SIGNED & APPROVED", 25, 35);

    ctx.font = "italic 13px serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(signatoryName, 25, 60);

    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText(signatoryTitle, 25, 78);

    ctx.font = "10px monospace";
    ctx.fillStyle = "#64748b";
    ctx.fillText(`TIMESTAMP: ${new Date().toISOString()}`, 25, 95);
    ctx.restore();

    setHasDrawn(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] my-auto flex flex-col rounded-xl border shadow-2xl animate-fade-up shrink-0 overflow-hidden"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
              Digital Signature & Seal
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:opacity-70 cursor-pointer"
            style={{ color: "var(--color-text-3)" }}
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
            Draw your signature on the pad below or click <strong className="text-blue-500">"Apply Official Stamp"</strong> to apply the authorized seal.
          </p>

          <div
            className="relative rounded-xl p-2 border shadow-inner"
            style={{ background: "#ffffff", borderColor: "var(--color-border)" }}
          >
            <canvas
              ref={canvasRef}
              width={440}
              height={120}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-32 cursor-crosshair touch-none rounded-lg"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs italic">
                Sign here with mouse or touch
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t flex-wrap" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={clearCanvas}>
                Clear
              </Button>
              <Button variant="secondary" size="sm" icon={<Stamp className="w-3.5 h-3.5 text-indigo-500" />} onClick={generateStampSignature}>
                Apply Official Stamp
              </Button>
            </div>

            <Button
              variant="success"
              size="sm"
              icon={<Check className="w-3.5 h-3.5" />}
              onClick={handleSave}
              disabled={!hasDrawn}
            >
              Save Signature & Attach
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
