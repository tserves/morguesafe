import { useRef } from 'react';
import DecedentLabel from './DecedentLabel';
import { Button } from '@/components/ui/button';
import { X, Printer, Download } from 'lucide-react';

export default function LabelPrintModal({ decedent, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = document.getElementById('decedent-label');
    if (!content) return;
    const printWindow = window.open('', '_blank', 'width=400,height=500');
    printWindow.document.write(`
      <html>
        <head>
          <title>Label — ${decedent.unique_id}</title>
          <style>
            body { margin: 20px; font-family: sans-serif; }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>
          ${content.outerHTML}
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-foreground">Case Label</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Label Preview */}
        <div className="flex justify-center mb-5" ref={printRef}>
          <DecedentLabel decedent={decedent} />
        </div>

        <p className="text-xs text-muted-foreground text-center mb-4">
          Scan the QR code or barcode to instantly look up this case
        </p>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={onClose}>
            <X className="w-3.5 h-3.5" /> Close
          </Button>
          <Button className="flex-1 gap-2" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" /> Print Label
          </Button>
        </div>
      </div>
    </div>
  );
}