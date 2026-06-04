import { useRef } from 'react';
import QRCode from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

const QR_PURPOSES = [
  'Body Identification',
  'Storage Assignment',
  'Movement Tracking',
  'Handover Verification',
];

function BarcodeImage({ value }) {
  const canvasRef = useRef(null);
  if (canvasRef.current && value) {
    try {
      JsBarcode(canvasRef.current, value, {
        format: 'CODE128',
        lineColor: '#000',
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 10,
      });
    } catch (_) {}
  }
  return (
    <div ref={(el) => {
      if (el) {
        const canvas = el.querySelector('canvas');
        if (canvas && value) {
          try {
            JsBarcode(canvas, value, {
              format: 'CODE128',
              lineColor: '#000',
              width: 2,
              height: 50,
              displayValue: true,
              fontSize: 10,
            });
          } catch (_) {}
        }
      }
    }}>
      <canvas />
    </div>
  );
}

export default function IntakePrintModal({ open, onClose, decedentId, uniqueId, bagNumber }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`
      <html>
        <head>
          <title>Intake Labels — ${uniqueId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 16px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .label-card { border: 1px solid #ccc; border-radius: 8px; padding: 12px; text-align: center; break-inside: avoid; }
            .label-card h4 { font-size: 10px; text-transform: uppercase; color: #666; margin: 0 0 6px 0; }
            .label-card p { font-size: 11px; font-weight: bold; margin: 4px 0 0 0; font-family: monospace; }
            .barcode-section { border: 2px solid #333; border-radius: 8px; padding: 12px; text-align: center; margin-top: 8px; }
            .barcode-section h3 { font-size: 12px; text-transform: uppercase; margin: 0 0 8px 0; color: #333; }
            canvas { max-width: 100%; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const qrValue = `${window.location.origin}/decedent/${decedentId}`;
  const barcodeValue = bagNumber || `EFFECTS-${uniqueId}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Print Labels</DialogTitle>
        </DialogHeader>

        <div ref={printRef}>
          {/* 4 QR Codes */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {QR_PURPOSES.map((purpose) => (
              <div key={purpose} className="border rounded-lg p-3 text-center">
                <p className="text-[10px] uppercase text-muted-foreground font-medium mb-2">{purpose}</p>
                <div className="flex justify-center">
                  <QRCode value={qrValue} size={96} />
                </div>
                <p className="text-[10px] font-mono mt-2 text-foreground">{uniqueId}</p>
              </div>
            ))}
          </div>

          {/* Personal Effects Barcode */}
          <div className="border-2 border-foreground/30 rounded-lg p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Personal Effects Barcode
            </p>
            <div className="flex justify-center">
              <BarcodeCanvas value={barcodeValue} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Bag/Tag: {barcodeValue}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="w-4 h-4 mr-2" /> Print All Labels
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BarcodeCanvas({ value }) {
  return (
    <svg
      ref={(el) => {
        if (el && value) {
          try {
            JsBarcode(el, value, {
              format: 'CODE128',
              lineColor: '#000',
              width: 2,
              height: 50,
              displayValue: true,
              fontSize: 11,
            });
          } catch (_) {}
        }
      }}
    />
  );
}