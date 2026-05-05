import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, CheckCircle, Loader2, X, AlertTriangle } from 'lucide-react';

export default function PersonalEffects() {
  const [effects, setEffects] = useState([]);
  const [decedents, setDecedents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    decedent_id: '', item_name: '', description: '', category: '',
    quantity: 1, estimated_value: '', condition: '', storage_location: '',
    status: 'logged', logged_by: '', notes: ''
  });

  useEffect(() => {
    Promise.all([
      base44.entities.PersonalEffect.list('-created_date', 200),
      base44.entities.Decedent.list('-arrival_datetime', 200),
    ]).then(([e, d]) => {
      setEffects(e);
      setDecedents(d);
      setLoading(false);
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const decedent = decedents.find(d => d.id === form.decedent_id);
    const effect = await base44.entities.PersonalEffect.create({
      ...form,
      decedent_unique_id: decedent?.unique_id,
      quantity: Number(form.quantity),
    });

    // Update decedent personal_effects_logged flag
    if (decedent && !decedent.personal_effects_logged) {
      await base44.entities.Decedent.update(form.decedent_id, { personal_effects_logged: true });
    }

    // Log to custody
    await base44.entities.CustodyLog.create({
      decedent_id: form.decedent_id,
      decedent_unique_id: decedent?.unique_id,
      action_type: 'personal_effects_logged',
      performed_by: form.logged_by || 'System',
      performed_by_role: 'Morgue Technician',
      timestamp: new Date().toISOString(),
      notes: `Item logged: ${form.item_name} (${form.category})`,
    });

    setEffects(prev => [effect, ...prev]);
    setSaving(false);
    setShowForm(false);
    setForm({ decedent_id: '', item_name: '', description: '', category: '', quantity: 1, estimated_value: '', condition: '', storage_location: '', status: 'logged', logged_by: '', notes: '' });
  };

  const handleRelease = async (effect) => {
    const updated = await base44.entities.PersonalEffect.update(effect.id, {
      status: 'released',
      release_datetime: new Date().toISOString(),
      acknowledgment_signed: true,
    });
    setEffects(prev => prev.map(e => e.id === effect.id ? updated : e));
  };

  const filtered = effects.filter(e =>
    !search ||
    e.item_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.decedent_unique_id?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = effects.filter(e => e.status === 'logged' || e.status === 'secured').length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Personal Effects"
        subtitle="Belongings inventory and custody"
        actions={
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full ring-1 ring-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                {pendingCount} Pending
              </div>
            )}
            <Button size="sm" className="gap-2" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" /> Log Item
            </Button>
          </div>
        }
      />

      {/* Form */}
      {showForm && (
        <div className="bg-card border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Log Personal Effect</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Decedent *</Label>
              <Select value={form.decedent_id} onValueChange={v => set('decedent_id', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select case" /></SelectTrigger>
                <SelectContent>
                  {decedents.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.unique_id} — {d.first_name || 'Unidentified'} {d.last_name || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Item Name *</Label>
              <Input className="mt-1.5" value={form.item_name} onChange={e => set('item_name', e.target.value)} placeholder="e.g. Gold ring" />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => set('category', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {['jewelry','clothing','documents','electronics','currency','keys','medical_devices','other'].map(c => (
                    <SelectItem key={c} value={c}>{c.replace(/\b\w/g,x=>x.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" min="1" className="mt-1.5" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
            </div>
            <div>
              <Label>Estimated Value</Label>
              <Input className="mt-1.5" value={form.estimated_value} onChange={e => set('estimated_value', e.target.value)} placeholder="e.g. ~$200" />
            </div>
            <div>
              <Label>Condition</Label>
              <Input className="mt-1.5" value={form.condition} onChange={e => set('condition', e.target.value)} placeholder="Good / Damaged / etc." />
            </div>
            <div>
              <Label>Storage Location</Label>
              <Input className="mt-1.5" value={form.storage_location} onChange={e => set('storage_location', e.target.value)} placeholder="Safe / Locker A / etc." />
            </div>
            <div>
              <Label>Logged By</Label>
              <Input className="mt-1.5" value={form.logged_by} onChange={e => set('logged_by', e.target.value)} placeholder="Officer name" />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea className="mt-1.5" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Additional details..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.decedent_id || !form.item_name || !form.category}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Log Item
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search by item name or case ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No effects recorded</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(effect => (
            <div key={effect.id} className="bg-card border rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-muted-foreground">{effect.decedent_unique_id}</span>
                    <StatusBadge status={effect.status} />
                  </div>
                  <p className="font-semibold text-sm">{effect.item_name}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="capitalize">{effect.category}</span>
                    <span>Qty: {effect.quantity}</span>
                    {effect.estimated_value && <span>{effect.estimated_value}</span>}
                    {effect.storage_location && <span>📍 {effect.storage_location}</span>}
                  </div>
                  {effect.description && <p className="text-xs text-muted-foreground mt-1">{effect.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {effect.acknowledgment_signed && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {(effect.status === 'logged' || effect.status === 'secured') && (
                  <Button size="sm" variant="outline" onClick={() => handleRelease(effect)}>
                    Release
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}