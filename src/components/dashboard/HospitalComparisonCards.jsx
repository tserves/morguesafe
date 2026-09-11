import { HOSPITAL_LIST, getHospital } from '@/lib/hospitals';
import { Users, Warehouse, ArrowUpRight, Heart, Fingerprint, LogOut, ArrowLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isToday } from 'date-fns';

/**
 * Side-by-side comparison cards for all three hospitals.
 * Shown on the dashboard when "All Locations" is selected.
 */
export default function HospitalComparisonCards({ decedents, storageUnits, releases, transfers }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {HOSPITAL_LIST.map(h => {
        const hospDecedents = decedents.filter(d => d.hospital_location === h.id);
        const activeCases = hospDecedents.filter(d => d.status !== 'released' && d.status !== 'transferred');
        const todayAdmissions = hospDecedents.filter(d => d.arrival_datetime && isToday(new Date(d.arrival_datetime)));
        const hospStorage = storageUnits.filter(u => u.hospital_location === h.id);
        const cap = hospStorage.reduce((a, u) => a + (u.capacity || 0), 0);
        const occ = hospStorage.reduce((a, u) => a + (u.current_occupancy || 0), 0);
        const pct = cap ? Math.round((occ / cap) * 100) : 0;
        const pendingReleases = releases.filter(r => r.hospital_location === h.id && r.status !== 'completed' && r.status !== 'rejected');
        const donorCases = hospDecedents.filter(d => d.is_donor === 'yes');
        const unidentified = hospDecedents.filter(d => d.identification_status === 'unidentified');
        const hospTransfers = transfers.filter(t => t.from_hospital === h.id || t.to_hospital === h.id);

        return (
          <Link
            key={h.id}
            to="/intake-list"
            className="bg-white border-2 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
            style={{ borderColor: h.color + '40' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: h.color }} />
              <h3 className="text-sm font-bold text-slate-800">{h.short}</h3>
 <span className="text-[10px] text-slate-400 font-mono ml-auto">{h.code}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Active</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{activeCases.length}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Today</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{todayAdmissions.length}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  <Warehouse className="w-3 h-3 text-cyan-500" />
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Storage</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{occ}/{cap}</p>
                <div className="mt-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  <LogOut className="w-3 h-3 text-amber-500" />
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Pend. Rel.</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{pendingReleases.length}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
              {donorCases.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                  <Heart className="w-2.5 h-2.5" /> {donorCases.length} donor
                </span>
              )}
              {unidentified.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                  <Fingerprint className="w-2.5 h-2.5" /> {unidentified.length} unidentified
                </span>
              )}
              {hospTransfers.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                  <ArrowLeftRight className="w-2.5 h-2.5" /> {hospTransfers.length} transfers
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}