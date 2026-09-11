import { HOSPITAL_LIST } from '@/lib/hospitals';
import { Warehouse, Thermometer } from 'lucide-react';

/**
 * Per-hospital storage capacity and occupancy panel.
 * Shows occupancy percentages and available capacity for all three hospitals.
 */
export default function StorageCapacityPanel({ storageUnits, selectedLocation }) {
  const hospitals = selectedLocation === 'all'
    ? HOSPITAL_LIST
    : HOSPITAL_LIST.filter(h => h.id === selectedLocation);

  return (
    <div className={`grid gap-4 ${selectedLocation === 'all' ? 'md:grid-cols-3' : ''}`}>
      {hospitals.map(h => {
        const units = storageUnits.filter(u => u.hospital_location === h.id);
        const cap = units.reduce((a, u) => a + (u.capacity || 0), 0);
        const occ = units.reduce((a, u) => a + (u.current_occupancy || 0), 0);
        const available = cap - occ;
        const pct = cap ? Math.round((occ / cap) * 100) : 0;
        const occupied = units.filter(u => u.status === 'occupied').length;
        const maint = units.filter(u => u.status === 'maintenance').length;

        return (
          <div key={h.id} className="bg-white border-2 rounded-2xl p-5 shadow-sm" style={{ borderColor: h.color + '30' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: h.color }} />
              <h3 className="text-sm font-bold text-slate-800">{h.short}</h3>
              <span className="text-[10px] text-slate-400 font-mono ml-auto">{h.code}</span>
            </div>

            <div className="flex items-end gap-2 mb-3">
              <p className="text-3xl font-bold text-slate-800">{pct}%</p>
              <p className="text-xs text-slate-400 mb-1">occupied</p>
            </div>

            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-[10px] text-slate-400 uppercase">Total</p>
                <p className="text-sm font-bold text-slate-700">{cap}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2">
                <p className="text-[10px] text-red-400 uppercase">Occupied</p>
                <p className="text-sm font-bold text-red-700">{occ}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-[10px] text-green-400 uppercase">Available</p>
                <p className="text-sm font-bold text-green-700">{available}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                <Warehouse className="w-2.5 h-2.5" /> {units.length} units
              </span>
              {occupied > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
                  {occupied} in use
                </span>
              )}
              {maint > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">
                  {maint} maintenance
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}