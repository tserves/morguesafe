import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Building2, Layers } from 'lucide-react';
import { useLocation } from '@/lib/LocationContext';
import { HOSPITAL_LIST } from '@/lib/hospitals';
import { cn } from '@/lib/utils';

/**
 * Persistent hospital location selector dropdown.
 * Shown in the main navigation header. Filters all dashboard data, cases,
 * storage, reports, alerts, and activity logs by the selected hospital.
 */
export default function LocationSelector() {
  const { selectedLocation, setSelectedLocation } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = selectedLocation === 'all'
    ? { name: 'All Locations', short: 'All Locations', color: '#64748b', code: 'ALL' }
    : HOSPITAL_LIST.find(h => h.id === selectedLocation) || { name: 'All Locations', short: 'All Locations', color: '#64748b' };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-sm"
      >
        {selectedLocation === 'all' ? (
          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <Building2 className="w-3.5 h-3.5" style={{ color: selected.color }} />
        )}
        <span className="font-medium text-foreground hidden sm:inline">{selected.short || selected.name}</span>
        <span className="font-medium text-foreground sm:hidden">{selected.code || 'ALL'}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b bg-muted/40">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Hospital Location</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => { setSelectedLocation('all'); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left',
                selectedLocation === 'all' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
              )}
            >
              <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="flex-1">All Locations</span>
              {selectedLocation === 'all' && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
            {HOSPITAL_LIST.map(h => (
              <button
                key={h.id}
                onClick={() => { setSelectedLocation(h.id); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left',
                  selectedLocation === h.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
                )}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                <div className="flex-1 min-w-0">
                  <p className="truncate">{h.short}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{h.code}</p>
                </div>
                {selectedLocation === h.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}