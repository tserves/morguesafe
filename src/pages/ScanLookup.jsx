import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import DecedentLabel from '@/components/DecedentLabel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  QrCode, Search, ScanLine, ArrowRight, Loader2,
  AlertCircle, CheckCircle, Camera, Keyboard
} from 'lucide-react';
import LabelPrintModal from '@/components/LabelPrintModal';

export default function ScanLookup() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('manual'); // 'manual' | 'scanner'
  const [showLabel, setShowLabel] = useState(false);
  const scanBuffer = useRef('');
  const scanTimer = useRef(null);
  const inputRef = useRef(null);

  // Hardware barcode scanner support: scanners typically send chars rapidly then press Enter
  useEffect(() => {
    if (mode !== 'scanner') return;

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        const scanned = scanBuffer.current.trim();
        if (scanned) {
          setQuery(scanned);
          doLookup(scanned);
        }
        scanBuffer.current = '';
        clearTimeout(scanTimer.current);
      } else if (e.key.length === 1) {
        scanBuffer.current += e.key;
        clearTimeout(scanTimer.current);
        // auto-submit if no new key in 200ms (end of barcode scan)
        scanTimer.current = setTimeout(() => {
          const scanned = scanBuffer.current.trim();
          if (scanned.length > 3) {
            setQuery(scanned);
            doLookup(scanned);
          }
          scanBuffer.current = '';
        }, 200);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  const doLookup = async (searchVal) => {
    const val = (searchVal || query).trim().toUpperCase();
    if (!val) return;
    setLoading(true);
    setError('');
    setResult(null);

    // Try matching unique_id or case_number
    const all = await base44.entities.Decedent.list('-arrival_datetime', 500);
    const match = all.find(d =>
      d.unique_id?.toUpperCase() === val ||
      d.case_number?.toUpperCase() === val ||
      d.law_enforcement_case?.toUpperCase() === val
    );

    // Also try parsing QR JSON payload
    if (!match) {
      try {
        const parsed = JSON.parse(decodeURIComponent(searchVal || query));
        if (parsed.uid) {
          const qrMatch = all.find(d => d.unique_id === parsed.uid);
          if (qrMatch) {
            setResult(qrMatch);
            setLoading(false);
            return;
          }
        }
      } catch {}
    }

    if (match) {
      setResult(match);
    } else {
      setError(`No case found for "${val}". Check the ID and try again.`);
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doLookup();
  };

  const name = result
    ? result.first_name
      ? `${result.first_name} ${result.last_name || ''}`.trim()
      : 'Unidentified Decedent'
    : '';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Scan & Lookup"
        subtitle="Scan a QR code or barcode to instantly access a case"
      />

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'manual' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Keyboard className="w-4 h-4" /> Manual Entry
        </button>
        <button
          onClick={() => { setMode('scanner'); setResult(null); setError(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'scanner' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <ScanLine className="w-4 h-4" /> Hardware Scanner
        </button>
      </div>

      {/* Manual Entry */}
      {mode === 'manual' && (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              className="pl-9 font-mono"
              placeholder="MS-2026-0001 or CAS-2026-0441"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit" disabled={!query.trim() || loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </form>
      )}

      {/* Scanner Waiting State */}
      {mode === 'scanner' && (
        <div className="bg-card border-2 border-dashed border-primary/30 rounded-2xl p-10 flex flex-col items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
            <ScanLine className="w-8 h-8 text-primary" />
          </div>
          <p className="font-semibold text-foreground mb-1">Ready to Scan</p>
          <p className="text-sm text-muted-foreground text-center">
            Point your barcode / QR scanner at the case label.<br />
            The result will appear automatically.
          </p>
          {query && (
            <div className="mt-3 font-mono text-xs bg-muted px-3 py-1.5 rounded-full text-muted-foreground">
              Last scan: {query}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="bg-card border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600 font-medium">Case Found</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 mt-3">
            {/* Label Preview */}
            <div className="shrink-0">
              <DecedentLabel decedent={result} />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{result.unique_id}</p>
                <p className="text-lg font-bold mt-0.5">{name}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={result.status} />
                <StatusBadge status={result.identification_status} />
              </div>
              <div className="space-y-1 text-sm">
                {result.storage_location_label && (
                  <p className="text-muted-foreground">📍 {result.storage_location_label}</p>
                )}
                {result.case_number && (
                  <p className="text-muted-foreground">Case #: {result.case_number}</p>
                )}
                {result.intake_officer && (
                  <p className="text-muted-foreground">Intake Officer: {result.intake_officer}</p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => navigate(`/decedent/${result.id}`)}
                  className="gap-1.5"
                >
                  Open Case <ArrowRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowLabel(true)}
                  className="gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" /> Print Label
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showLabel && result && (
        <LabelPrintModal decedent={result} onClose={() => setShowLabel(false)} />
      )}
    </div>
  );
}