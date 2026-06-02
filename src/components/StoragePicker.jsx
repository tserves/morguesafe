import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Warehouse, CheckCircle2, XCircle, Clock, Thermometer, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_LABELS = {
  refrigerated_tray: 'Refrigerated Tray',
  freezer_compartment: 'Freezer',
  room_temperature_shelf: 'Room Temp',
  isolation_unit: 'Isolation',
  decomp_unit: 'Decomp Unit',
};

const TYPE_COLORS = {
  refrigerated_tray: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  freezer_compartment: 'text-blue-600 bg-blue-50 border-blue-200',
  room_temperature_shelf: 'text-amber-600 bg-amber-50 border-amber-200',
  isolation_unit: 'text-purple-600 bg-purple-50 border-purple-200',
  decomp_unit: 'text-orange-600 bg-orange-50 border-orange-200',
};

export default function StoragePicker({ selectedId, onSelect }) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    base44.entities.StorageUnit.list().then(data => {
      setUnits(data);
      setLoading(false);
    });
  }, []);

  const available = units.filter(u => u.status === 'available');
  const types = [...new Set(units.map(u => u.unit_type))];

  const filtered = available.filter(u =>
    typeFilter === 'all' || u.unit_type === typeFilter
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading storage units...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter('all')}
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
            typeFilter === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
          )}
        >
          All ({available.length} available)
        </button>
        {types.map(t => {
          const count = available.filter(u => u.unit_type === t).length;
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                typeFilter === t
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
              )}
            >
              {TYPE_LABELS[t] || t} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <Warehouse className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No available storage units
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
          {filtered.map(unit => {
            const isSelected = selectedId === unit.id;
            const occupancy = unit.current_occupancy ?? 0;
            const capacity = unit.capacity ?? 1;
            const pct = Math.round((occupancy / capacity) * 100);

            return (
              <button
                key={unit.id}
                onClick={() => onSelect(isSelected ? null : unit)}
                className={cn(
                  'text-left p-3 rounded-lg border-2 transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40 bg-card hover:bg-muted/30'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{unit.label}</p>
                    {unit.room && <p className="text-xs text-muted-foreground">{unit.room}</p>}
                  </div>
                  {isSelected
                    ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    : <CheckCircle2 className="w-4 h-4 text-muted-foreground/20 shrink-0 mt-0.5" />
                  }
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', TYPE_COLORS[unit.unit_type] || 'text-muted-foreground bg-muted border-border')}>
                    {TYPE_LABELS[unit.unit_type] || unit.unit_type}
                  </span>
                  {unit.temperature_celsius != null && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border bg-slate-50 border-slate-200 text-slate-600 flex items-center gap-0.5">
                      <Thermometer className="w-2.5 h-2.5" />{unit.temperature_celsius}°C
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Occupancy</span>
                    <span>{occupancy}/{capacity}</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', pct < 60 ? 'bg-green-500' : pct < 90 ? 'bg-amber-500' : 'bg-red-500')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* No available storage warning */}
      {available.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <XCircle className="w-4 h-4 shrink-0" />
          No storage units currently available. The intake can still be submitted — assign storage later.
        </div>
      )}

      {selectedId && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Storage assigned: <span className="font-medium">{units.find(u => u.id === selectedId)?.label}</span>
        </div>
      )}
    </div>
  );
}