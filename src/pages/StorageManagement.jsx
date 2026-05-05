import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Warehouse, Plus, Thermometer, AlertTriangle, 
  CheckCircle, Loader2, X
} from 'lucide-react';

export default function StorageManagement() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: '', room: '', unit_type: '', capacity: 1,
    temperature_celsius: -4, status: 'available', location_code: '', notes: ''
  });

  useEffect(() => {
    base44.entities.StorageUnit.list('label').then(u => {
      setUnits(u);
      setLoading(false);
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const unit = await base44.entities.StorageUnit.create({
      ...form,
      capacity: Number(form.capacity),
      temperature_celsius: Number(form.temperature_celsius),
      current_occupancy: 0,
    });
    setUnits(prev => [...prev, unit]);
    setSaving(false);
    setShowForm(false);
    setForm({ label: '', room: '', unit_type: '', capacity: 1, temperature_celsius: -4, status: 'available', location_code: '', notes: '' });
  };

  const byRoom = units.reduce((acc, u) => {
    const room = u.room || 'Unassigned';
    if (!acc[room]) acc[room] = [];
    acc[room].push(u);
    return acc;
  }, {});

  const totalCapacity = units.reduce((a, u) => a + (u.capacity || 0), 0);
  const totalOccupied = units.reduce((a, u) => a + (u.current_occupancy || 0), 0);
  const occupancyPct = totalCapacity ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Storage Management"
        subtitle="Morgue compartment map and occupancy"
        actions={
          <Button size="sm" className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Add Unit
          </Button>
        }
      />

      {/* Capacity Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Units</p>
          <p className="text-2xl font-bold mt-1">{units.length}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Occupied</p>
          <p className="text-2xl font-bold mt-1">{totalOccupied} / {totalCapacity}</p>
        </div>
        <div className={`border rounded-xl p-4 ${occupancyPct >= 90 ? 'bg-red-50 border-red-200' : occupancyPct >= 70 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Occupancy</p>
          <p className="text-2xl font-bold mt-1">{occupancyPct}%</p>
          <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${occupancyPct >= 90 ? 'bg-red-500' : occupancyPct >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add Unit Form */}
      {showForm && (
        <div className="bg-card border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Add Storage Unit</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>Label *</Label>
              <Input className="mt-1.5" placeholder="e.g. Room A - Rack 1 - Tray 3" value={form.label} onChange={e => set('label', e.target.value)} />
            </div>
            <div>
              <Label>Room</Label>
              <Input className="mt-1.5" placeholder="e.g. Room A" value={form.room} onChange={e => set('room', e.target.value)} />
            </div>
            <div>
              <Label>Unit Type</Label>
              <Select value={form.unit_type} onValueChange={v => set('unit_type', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  {['refrigerated_tray','freezer_compartment','room_temperature_shelf','isolation_unit','decomp_unit'].map(t => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Capacity</Label>
              <Input type="number" min="1" className="mt-1.5" value={form.capacity} onChange={e => set('capacity', e.target.value)} />
            </div>
            <div>
              <Label>Temperature (°C)</Label>
              <Input type="number" className="mt-1.5" value={form.temperature_celsius} onChange={e => set('temperature_celsius', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.label || !form.unit_type}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Unit
            </Button>
          </div>
        </div>
      )}

      {/* Storage Grid by Room */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : units.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Warehouse className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No storage units configured</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowForm(true)}>
            Add First Unit
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byRoom).map(([room, roomUnits]) => (
            <div key={room}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Warehouse className="w-4 h-4" />{room}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {roomUnits.map(unit => {
                  const occ = unit.current_occupancy || 0;
                  const cap = unit.capacity || 1;
                  const pct = Math.round((occ / cap) * 100);
                  const isFull = occ >= cap;
                  const isNearFull = pct >= 80;

                  return (
                    <div
                      key={unit.id}
                      className={`border rounded-xl p-4 transition-all ${
                        isFull ? 'bg-red-50 border-red-200' :
                        isNearFull ? 'bg-amber-50 border-amber-200' :
                        'bg-card hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <StatusBadge status={unit.status} />
                        {isFull && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                        {!isFull && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                      </div>
                      <p className="text-sm font-semibold mt-2 leading-tight">{unit.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {unit.unit_type?.replace(/_/g,' ')}
                      </p>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{occ} / {cap}</span>
                          {unit.temperature_celsius !== undefined && (
                            <span className="flex items-center gap-0.5">
                              <Thermometer className="w-3 h-3" />{unit.temperature_celsius}°C
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isFull ? 'bg-red-500' : isNearFull ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      {unit.current_decedent_name && (
                        <p className="text-[10px] text-muted-foreground mt-2 truncate">
                          {unit.current_decedent_name}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}