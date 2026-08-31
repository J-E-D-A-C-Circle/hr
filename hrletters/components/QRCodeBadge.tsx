"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeBadgeProps {
  text?: string;
  code?: string;
  size?: number;
}

export const QRCodeBadge: React.FC<QRCodeBadgeProps> = ({ text, code, size = 90 }) => {
  const [dataUrl, setDataUrl] = useState<string>("");
  const qrString = text || code || "DVLA-HR-VERIFICATION";

  useEffect(() => {
    QRCode.toDataURL(qrString, { width: size, margin: 1 })
      .then((url: string) => setDataUrl(url))
      .catch((err: any) => console.error("QR Code generation error:", err));
  }, [qrString, size]);

  if (!dataUrl) {
    return <div className="w-20 h-20 bg-slate-200 animate-pulse rounded-lg" />;
  }

  return (
    <div className="flex flex-col items-center bg-white p-1.5 border border-slate-300 rounded-xl shadow-sm">
      <img src={dataUrl} alt="Verification QR Code" className="rounded" width={size} height={size} />
      <span className="text-[9px] font-mono text-slate-600 font-bold mt-1 tracking-tight">SCAN TO VERIFY</span>
    </div>
  );
};
