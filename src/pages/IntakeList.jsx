import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  UserPlus, Search, Pencil, X, Check, Loader2,
  AlertTriangle, ChevronRight, Filter, Warehouse, Clock, Heart
} from 'lucide-react';
import { format } from 'date-fns';
import DonorBadge from '@/components/DonorBadge';

const TYPE_LABELS = {
  refrigerated_tray: 'Refrigerated',
  freezer_compartment: 'Freezer',
  room_temperature_shelf: 'Room Temp',
  isolation_unit: 'Isolation',
  decomp_unit: 'Decomp',
};

const EDITABLE_FIELDS = [
  { key: 'first_name', label: 'First Name', type: 'text' },
  { key: 'last_name', label: 'Last Name', type: 'text' },
  { key: 'case_number', label: 'Case #', type: 'text' },
  { key: 'law_enforcement_case', label: 'LE Case #', type: 'text' },
  { key: 'intake_officer', label: 'Intake Officer', type: 'text' },
  { key: 'source_name', label: 'Source Name', type: 'text' },
  { key: 'storage_location_label', label: 'Storage Location', type: 'text' },
  { key: 'condition_notes', label: 'Condition Notes', type: 'textarea' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
  { key: 'next_of_kin_name', label: 'Next of Kin', type: 'text' },
  { key: 'next_of_kin_contact', label: 'NOK Contact', type: 'text' },
];

function EditModal({ decedent, onSave, onClose }) {
  const [form, setForm] = useState({ ...decedent });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(decedent.id, form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{decedent.unique_id}</p>
            <h3 className="font-semibold text-foreground">
              {decedent.first_name ? `${decedent.first_name} ${decedent.last_name || ''}`.trim() : 'Unidentified Decedent'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['intake','storage','examination','holding','released','transferred'].map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ID Status</Label>
              <Select value={form.identification_status} onValueChange={v => set('identification_status', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="identified">Identified</SelectItem>
                  <SelectItem value="unidentified">Unidentified</SelectItem>
                  <SelectItem value="pending_verification">Pending Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {EDITABLE_FIELDS.map(({ key, label, type }) =>
              type === 'textarea' ? null : (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input className="mt-1.5" value={form[key] || ''} onChange={e => set(key, e.target.value)} />
                </div>
              )
            )}
          </div>

          {EDITABLE_FIELDS.filter(f => f.type === 'textarea').map(({ key, label }) => (
            <div key={key}>
              <Label>{label}</Label>
              <Textarea className="mt-1.5" rows={2} value={form[key] || ''} onChange={e => set(key, e.target.value)} />
            </div>
          ))}

          <div className="flex items-center gap-3">
            <input type="checkbox" id="autopsy-edit" checked={!!form.requires_autopsy} onChange={e => set('requires_autopsy', e.target.checked)} className="w-4 h-4 rounded accent-primary" />
            <Label htmlFor="autopsy-edit" className="cursor-pointer">Autopsy Required</Label>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function StorageCell({ decedent, storageUnits }) {
  if (!decedent.storage_location_id && !decedent.storage_location_label) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
        <Clock className="w-3 h-3" /> Storage Pending
      </span>
    );
  }

  const unit = storageUnits.find(u => u.id === decedent.storage_location_id);
  return (
    <div>
      <p className="text-xs font-medium text-foreground flex items-center gap-1">
        <Warehouse className="w-3 h-3 text-cyan-500" />
        {decedent.storage_location_label}
      </p>
      {unit?.unit_type && (
        <p className="text-[10px] text-muted-foreground mt-0.5">{TYPE_LABELS[unit.unit_type] || unit.unit_type}</p>
      )}
    </div>
  );
}

export default function IntakeList() {
  const [decedents, setDecedents] = useState([]);
  const [storageUnits, setStorageUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [storageFilter, setStorageFilter] = useState('all'); // 'all' | 'assigned' | 'pending'
  const [storageTypeFilter, setStorageTypeFilter] = useState('all');
  const [donorFilter, setDonorFilter] = useState('all'); // 'all' | 'donor' | 'non_donor'
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Decedent.list('-arrival_datetime', 200),
      base44.entities.StorageUnit.list(),
    ]).then(([d, s]) => {
      setDecedents(d);
      setStorageUnits(s);
      setLoading(false);
    });
  }, []);

  const handleSave = async (id, updatedData) => {
    const updated = await base44.entities.Decedent.update(id, updatedData);
    setDecedents(prev => prev.map(d => d.id === id ? updated : d));
  };

  const storageTypes = [...new Set(storageUnits.map(u => u.unit_type))];

  const filtered = decedents.filter(d => {
    const name = `${d.first_name || ''} ${d.last_name || ''}`.toLowerCase();
    const matchSearch = !search ||
      name.includes(search.toLowerCase()) ||
      d.unique_id?.toLowerCase().includes(search.toLowerCase()) ||
      d.case_number?.toLowerCase().includes(search.toLowerCase()) ||
      d.intake_officer?.toLowerCase().includes(search.toLowerCase()) ||
      d.storage_location_label?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'all' || d.status === statusFilter;

    const hasStorage = !!(d.storage_location_id || d.storage_location_label);
    const matchStorage =
      storageFilter === 'all' ||
      (storageFilter === 'assigned' && hasStorage) ||
      (storageFilter === 'pending' && !hasStorage);

    const unit = storageUnits.find(u => u.id === d.storage_location_id);
    const matchStorageType =
      storageTypeFilter === 'all' ||
      (unit && unit.unit_type === storageTypeFilter);

    const matchDonor =
      donorFilter === 'all' ||
      (donorFilter === 'donor' && d.is_donor === 'yes') ||
      (donorFilter === 'non_donor' && d.is_donor !== 'yes');

    return matchSearch && matchStatus && matchStorage && matchStorageType && matchDonor;
  });

  const pendingCount = decedents.filter(d => !d.storage_location_id && !d.storage_location_label).length;
  const donorCount = decedents.filter(d => d.is_donor === 'yes').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Intake List"
        subtitle={`${decedents.length} total cases · ${pendingCount} storage pending · ${donorCount} donor cases`}
        actions={
          <Link to="/intake">
            <Button size="sm" className="gap-2">
              <UserPlus className="w-4 h-4" /> New Intake
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, ID, case #, storage..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {['intake','storage','examination','holding','released','transferred'].map(s => (
              <SelectItem key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={storageFilter} onValueChange={setStorageFilter}>
          <SelectTrigger className="w-44">
            <Warehouse className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Storage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Storage</SelectItem>
            <SelectItem value="assigned">Storage Assigned</SelectItem>
            <SelectItem value="pending">Storage Pending</SelectItem>
          </SelectContent>
        </Select>

        <Select value={storageTypeFilter} onValueChange={setStorageTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Storage Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {storageTypes.map(t => (
              <SelectItem key={t} value={t}>{TYPE_LABELS[t] || t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={donorFilter} onValueChange={setDonorFilter}>
          <SelectTrigger className="w-40">
            <Heart className="w-3.5 h-3.5 mr-1.5 text-red-400" />
            <SelectValue placeholder="Donor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cases</SelectItem>
            <SelectItem value="donor">Donor Cases</SelectItem>
            <SelectItem value="non_donor">Non-Donor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {pendingCount > 0 && (
          <button
            onClick={() => setStorageFilter(storageFilter === 'pending' ? 'all' : 'pending')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              storageFilter === 'pending'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3 h-3" />
            {pendingCount} awaiting storage assignment
          </button>
        )}
        {donorCount > 0 && (
          <button
            onClick={() => setDonorFilter(donorFilter === 'donor' ? 'all' : 'donor')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              donorFilter === 'donor'
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
            }`}
          >
            <Heart className="w-3 h-3" />
            {donorCount} donor cases
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <UserPlus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No cases found</p>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Case ID</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Arrival</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Source</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Storage</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Officer</th>
                  <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const name = d.first_name ? `${d.first_name} ${d.last_name || ''}`.trim() : 'Unidentified';
                  return (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {d.flags?.length > 0 && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
                          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{d.unique_id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{d.gender}{d.estimated_age ? ` · ~${d.estimated_age}y` : ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={d.status} />
                          <StatusBadge status={d.identification_status} />
                          <DonorBadge decedent={d} />
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {d.arrival_datetime ? format(new Date(d.arrival_datetime), 'MMM d, yyyy HH:mm') : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <p>{d.source_name || '—'}</p>
                        <p className="capitalize text-muted-foreground/70">{d.source_type?.replace('_',' ')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StorageCell decedent={d} storageUnits={storageUnits} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {d.intake_officer || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditTarget(d)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Link to={`/decedent/${d.id}`}>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t bg-muted/20 text-xs text-muted-foreground">
            {filtered.length} records shown
          </div>
        </div>
      )}

      {editTarget && (
        <EditModal
          decedent={editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}