import React, { useMemo } from 'react';

export default function TicketQR({ value }) {
  const code = useMemo(() => {
    if (!value || typeof window === 'undefined' || !window.EventFlowQR) return null;
    const { modules } = window.EventFlowQR.create(String(value), { errorCorrectionLevel: 'M' });
    let path = '';
    for (let y = 0; y < modules.size; y++) {
      for (let x = 0; x < modules.size; x++) {
        if (modules.get(y, x)) path += `M${x + 4} ${y + 4}h1v1h-1z`;
      }
    }
    return { path, size: modules.size + 8 };
  }, [value]);

  return code && <svg xmlns="http://www.w3.org/2000/svg"
    viewBox={`0 0 ${code.size} ${code.size}`} role="img" aria-label="Ticket QR code" shapeRendering="crispEdges">
    <rect width={code.size} height={code.size} fill="#fff" />
    <path d={code.path} fill="#000" />
  </svg>;
}
