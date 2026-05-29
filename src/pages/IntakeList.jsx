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
  AlertTriangle, ChevronRight, Filter, Users, SlidersHorizontal
} from 'lucide-react';
import { format } from 'date-fns';

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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-float w-full max-w-lg my-8 overflow-hidden animate-fade-in-up">
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-5 border-b border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-lg">{decedent.unique_id}</span>
              <h3 className="font-bold text-slate-800 text-lg mt-1">
                {decedent.first_name ? `${decedent.first_name} ${decedent.last_name || ''}`.trim() : 'Unidentified Decedent'}
              </h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1.5 rounded-xl border-slate-200 bg-slate-50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['intake','storage','examination','holding','released','transferred'].map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">ID Status</Label>
              <Select value={form.identification_status} onValueChange={v => set('identification_status', v)}>
                <SelectTrigger className="mt-1.5 rounded-xl border-slate-200 bg-slate-50"><SelectValue /></SelectTrigger>
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
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</Label>
                  <Input className="mt-1.5 rounded-xl border-slate-200 bg-slate-50 focus:bg-white h-9" value={form[key] || ''} onChange={e => set(key, e.target.value)} />
                </div>
              )
            )}
          </div>

          {EDITABLE_FIELDS.filter(f => f.type === 'textarea').map(({ key, label }) => (
            <div key={key}>
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</Label>
              <Textarea className="mt-1.5 rounded-xl border-slate-200 bg-slate-50 focus:bg-white" rows={2} value={form[key] || ''} onChange={e => set(key, e.target.value)} />
            </div>
          ))}

          <div className="flex items-center gap-3 pt-1">
            <div className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${form.requires_autopsy ? 'bg-indigo-600' : 'bg-slate-200'}`}
              onClick={() => set('requires_autopsy', !form.requires_autopsy)}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${form.requires_autopsy ? 'left-5' : 'left-1'}`} />
            </div>
            <Label className="cursor-pointer text-sm font-semibold text-slate-700" onClick={() => set('requires_autopsy', !form.requires_autopsy)}>
              Autopsy Required
            </Label>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <Button variant="outline" className="flex-1 rounded-xl border-slate-200" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function IntakeList() {
  const [decedents, setDecedents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    base44.entities.Decedent.list('-arrival_datetime', 200).then(d => {
      setDecedents(d);
      setLoading(false);
    });
  }, []);

  const handleSave = async (id, updatedData) => {
    const updated = await base44.entities.Decedent.update(id, updatedData);
    setDecedents(prev => prev.map(d => d.id === id ? updated : d));
  };

  const filtered = decedents.filter(d => {
    const name = `${d.first_name || ''} ${d.last_name || ''}`.toLowerCase();
    const matchSearch = !search ||
      name.includes(search.toLowerCase()) ||
      d.unique_id?.toLowerCase().includes(search.toLowerCase()) ||
      d.case_number?.toLowerCase().includes(search.toLowerCase()) ||
      d.intake_officer?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Intake List"
        subtitle="All registered cases"
        badge={`${decedents.length} total`}
        actions={
          <Link to="/intake">
            <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm h-9 font-semibold">
              <UserPlus className="w-3.5 h-3.5" /> New Intake
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-10 h-10 rounded-xl border-slate-200 bg-white shadow-sm focus:border-indigo-400"
            placeholder="Search by name, ID, case #, officer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 h-10 rounded-xl border-slate-200 bg-white shadow-sm">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {['intake','storage','examination','holding','released','transferred'].map(s => (
              <SelectItem key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-slate-300" />
          </div>
          <p className="font-semibold text-slate-600 mb-1">No cases found</p>
          <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-5 py-3.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">Case ID</th>
                  <th className="text-left px-5 py-3.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">Arrival</th>
                  <th className="text-left px-5 py-3.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">Source</th>
                  <th className="text-left px-5 py-3.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">Location</th>
                  <th className="text-left px-5 py-3.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">Officer</th>
                  <th className="text-right px-5 py-3.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const name = d.first_name ? `${d.first_name} ${d.last_name || ''}`.trim() : 'Unidentified';
                  return (
                    <tr key={d.id} className="border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {d.flags?.length > 0 && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          <span className="font-mono text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-lg">{d.unique_id}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800">{name}</p>
                        <p className="text-xs text-slate-400 capitalize mt-0.5">{d.gender}{d.estimated_age ? ` · ~${d.estimated_age}y` : ''}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={d.status} />
                          <StatusBadge status={d.identification_status} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-medium text-slate-500">
                        {d.arrival_datetime ? (
                          <div>
                            <p>{format(new Date(d.arrival_datetime), 'MMM d, yyyy')}</p>
                            <p className="text-slate-400">{format(new Date(d.arrival_datetime), 'HH:mm')}</p>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <p className="font-medium text-slate-700">{d.source_name || '—'}</p>
                        <p className="text-slate-400 capitalize">{d.source_type?.replace('_',' ')}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-medium text-slate-500">{d.storage_location_label || '—'}</td>
                      <td className="px-5 py-3.5 text-xs font-medium text-slate-500">{d.intake_officer || '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl hover:bg-indigo-50 hover:text-indigo-600" onClick={() => setEditTarget(d)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Link to={`/decedent/${d.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl hover:bg-indigo-50 hover:text-indigo-600">
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
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">{filtered.length} records shown</p>
            <p className="text-xs text-slate-400">Sorted by most recent</p>
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