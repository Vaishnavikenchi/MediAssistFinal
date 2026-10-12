import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';


export default function BarcodeDisplay({ value, medicineName, onReady }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        lineColor: '#1e293b',
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 14,
        font: 'Outfit, sans-serif',
        margin: 10,
        background: '#ffffff',
      });

      if (onReady) {
        onReady(() => downloadBarcode(value, medicineName));
      }
    } catch (err) {
      console.error('Barcode generation failed:', err);
    }
  }, [value, medicineName]);

  function downloadBarcode(barcode, name) {
    if (!svgRef.current) return;
   
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 300;
      canvas.height = img.height || 120;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const link = document.createElement('a');
      link.download = `barcode-${name || barcode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  }

  if (!value) return null;

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-inner">
      <svg ref={svgRef} className="max-w-full" />
      <p className="text-xs text-slate-500 font-mono">{value}</p>
    </div>
  );
}
