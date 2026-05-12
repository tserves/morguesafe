import { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { format } from 'date-fns';

/**
 * Printable label with QR code + barcode for a decedent.
 * Pass decedent object. Optionally pass printMode=true for print-only styling.
 */
export default function DecedentLabel({ decedent, printMode = false }) {
  const barcodeRef = useRef(null);

  const qrData = JSON.stringify({
    id: decedent.id,
    uid: decedent.unique_id,
    name: decedent.first_name ? `${decedent.first_name} ${decedent.last_name || ''}`.trim() : 'Unidentified',
    status: decedent.status,
    arrival: decedent.arrival_datetime,
  });

  // Barcode uses the unique_id string (e.g. MS-2026-0001 → strip non-alphanumeric for CODE128)
  const barcodeValue = decedent.unique_id?.replace(/[^A-Z0-9-]/gi, '') || 'UNKNOWN';

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, barcodeValue, {
        format: 'CODE128',
        width: 1.5,
        height: 40,
        displayValue: true,
        fontSize: 10,
        margin: 4,
        background: '#ffffff',
        lineColor: '#111827',
      });
    }
  }, [barcodeValue]);

  const name = decedent.first_name
    ? `${decedent.first_name} ${decedent.last_name || ''}`.trim()
    : 'Unidentified Decedent';

  const containerClass = printMode
    ? 'bg-white border-2 border-gray-800 rounded-lg p-4 w-80 font-sans'
    : 'bg-white border-2 border-gray-300 rounded-xl p-4 w-72 shadow-sm font-sans';

  return (
    <div className={containerClass} id="decedent-label">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-semibold">MorgueSafe</p>
          <p className="text-xs font-bold text-gray-900 font-mono">{decedent.unique_id}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-gray-500 uppercase tracking-wide">Status</p>
          <p className="text-xs font-semibold text-gray-800 capitalize">{decedent.status}</p>
        </div>
      </div>

      {/* Name & Details */}
      <div className="mb-3">
        <p className="text-sm font-bold text-gray-900 leading-tight">{name}</p>
        <div className="flex gap-3 mt-1 text-[10px] text-gray-500">
          {decedent.gender && <span className="capitalize">{decedent.gender}</span>}
          {decedent.estimated_age && <span>~{decedent.estimated_age} yrs</span>}
          {decedent.arrival_datetime && (
            <span>In: {format(new Date(decedent.arrival_datetime), 'dd MMM yyyy')}</span>
          )}
        </div>
        {decedent.storage_location_label && (
          <p className="text-[10px] text-gray-600 mt-0.5">📍 {decedent.storage_location_label}</p>
        )}
      </div>

      {/* Codes side by side */}
      <div className="flex items-center justify-between gap-3">
        {/* QR Code */}
        <div className="flex flex-col items-center">
          <QRCodeSVG
            value={qrData}
            size={72}
            bgColor="#ffffff"
            fgColor="#111827"
            level="M"
            includeMargin={false}
          />
          <p className="text-[8px] text-gray-400 mt-0.5">QR</p>
        </div>

        {/* Barcode */}
        <div className="flex-1 flex flex-col items-center">
          <svg ref={barcodeRef} className="w-full" />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-[8px] text-gray-400">
        <span>Case: {decedent.case_number || '—'}</span>
        <span className="capitalize">{decedent.identification_status?.replace('_', ' ')}</span>
      </div>
    </div>
  );
}