import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LogOut, Plus, CheckCircle, AlertCircle, Loader2, X, 
  Shield, FileText, User
} from 'lucide-react';
import { format } from 'date-fns';

function generateReceiptNumber() {
  return `RCP-${Date.now().toString(36).toUpperCase()}`;
}

const VERIFICATION_STEPS = [
  { key: 'id_verified', label: 'Receiving party ID verified' },
  { key: 'auth_docs', label: 'Authorization documents received' },
  { key: 'docs_complete', label: 'Case documentation complete' },
  { key: 'secondary_check', label: 'Secondary verification performed' },
  { key: 'effects_checked', label: 'Personal effects accounted for' },
];

export default function Release() {
  const [releases, setReleases] = useState([]);
  const [decedents, setDecedents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checks, setChecks] = useState({});
  const [form, setForm] = useState({
    decedent_id: '', release_type: '', receiving_party_name: '',
    receiving_party_organization: '', receiving_party_id_type: '',
    receiving_party_id_number: '', receiving_party_contact: '',
    identity_verified_by: '', secondary_verifier: '', notes: '',
    status: 'pending'
  });

  useEffect(() => {
    Promise.all([
      base44.entities.Release.list('-created_date', 50),
      base44.entities.Decedent.list('-arrival_datetime', 200),
    ]).then(([r, d]) => {
      setReleases(r);
      setDecedents(d.filter(d => d.status !== 'released'));
      setLoading(false);
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const allChecked = VERIFICATION_STEPS.every(s => checks[s.key]);

  const handleSubmit = async () => {
    setSaving(true);
    const decedent = decedents.find(d => d.id === form.decedent_id);
    const release = await base44.entities.Release.create({
      ...form,
      decedent_unique_id: decedent?.unique_id,
      decedent_name: decedent ? `${decedent.first_name || 'Unidentified'} ${decedent.last_name || ''}`.trim() : '',
      documentation_complete: checks.docs_complete || false,
      personal_effects_released: checks.effects_checked || false,
      receipt_number: generateReceiptNumber(),
      status: 'verification_in_progress',
    });

    setReleases(prev => [release, ...prev]);
    setSaving(false);
    setShowForm(false);
    setChecks({});
    setForm({ decedent_id: '', release_type: '', receiving_party_name: '', receiving_party_organization: '', receiving_party_id_type: '', receiving_party_id_number: '', receiving_party_contact: '', identity_verified_by: '', secondary_verifier: '', notes: '', status: 'pending' });
  };

  const handleApprove = async (release) => {
    const updated = await base44.entities.Release.update(release.id, {
      status: 'completed',
      release_datetime: new Date().toISOString(),
      approved_by: 'Current User',
      approval_datetime: new Date().toISOString(),
    });

    // Update decedent status
    await base44.entities.Decedent.update(release.decedent_id, { status: 'released' });

    // Log final custody event
    await base44.entities.CustodyLog.create({
      decedent_id: release.decedent_id,
      decedent_unique_id: release.decedent_unique_id,
      action_type: 'released',
      to_location: release.receiving_party_organization || release.receiving_party_name,
      performed_by: 'Current User',
      performed_by_role: 'Administrative Staff',
      timestamp: new Date().toISOString(),
      notes: `Released to ${release.receiving_party_name} (${release.release_type?.replace('_',' ')}) — Receipt: ${release.receipt_number}`,
      verification_method: 'digital_signature',
    });

    setReleases(prev => prev.map(r => r.id === release.id ? updated : r));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Release & Handover"
        subtitle="Multi-step verified release process"
        actions={
          <Button size="sm" className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Initiate Release
          </Button>
        }
      />

      {/* Form */}
      {showForm && (
        <div className="bg-card border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />Release Verification Process</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
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
              <Label>Release Type *</Label>
              <Select value={form.release_type} onValueChange={v => set('release_type', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {['funeral_home','family','law_enforcement','hospital','medical_examiner','repatriation','other'].map(t => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Receiving Party Name *</Label>
              <Input className="mt-1.5" value={form.receiving_party_name} onChange={e => set('receiving_party_name', e.target.value)} />
            </div>
            <div>
              <Label>Organization / Funeral Home</Label>
              <Input className="mt-1.5" value={form.receiving_party_organization} onChange={e => set('receiving_party_organization', e.target.value)} />
            </div>
            <div>
              <Label>ID Type</Label>
              <Input className="mt-1.5" value={form.receiving_party_id_type} onChange={e => set('receiving_party_id_type', e.target.value)} placeholder="Passport / National ID / etc." />
            </div>
            <div>
              <Label>ID Number</Label>
              <Input className="mt-1.5" value={form.receiving_party_id_number} onChange={e => set('receiving_party_id_number', e.target.value)} />
            </div>
            <div>
              <Label>Identity Verified By</Label>
              <Input className="mt-1.5" value={form.identity_verified_by} onChange={e => set('identity_verified_by', e.target.value)} placeholder="Verifying officer" />
            </div>
            <div>
              <Label>Secondary Verifier</Label>
              <Input className="mt-1.5" value={form.secondary_verifier} onChange={e => set('secondary_verifier', e.target.value)} placeholder="Second officer" />
            </div>
          </div>

          {/* Verification Checklist */}
          <div className="bg-muted/40 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              Verification Checklist
            </p>
            {VERIFICATION_STEPS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!checks[key]}
                  onChange={e => setChecks(c => ({ ...c, [key]: e.target.checked }))}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className={`text-sm ${checks[key] ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                {checks[key] ? (
                  <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 ml-auto" />
                )}
              </label>
            ))}
          </div>

          {!allChecked && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-4">
              <AlertCircle className="w-4 h-4" />
              All verification steps must be completed before release
            </div>
          )}

          <Textarea
            className="mb-4"
            placeholder="Additional notes..."
            rows={2}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !form.decedent_id || !form.release_type || !form.receiving_party_name || !allChecked}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
              Submit Release Request
            </Button>
          </div>
        </div>
      )}

      {/* Releases List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : releases.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <LogOut className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No release requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {releases.map(release => (
            <div key={release.id} className="bg-card border rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{release.decedent_unique_id}</span>
                    <StatusBadge status={release.status} />
                    {release.receipt_number && (
                      <span className="font-mono text-xs text-muted-foreground">{release.receipt_number}</span>
                    )}
                  </div>
                  <p className="font-semibold">{release.decedent_name}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{release.receiving_party_name}</span>
                    {release.receiving_party_organization && (
                      <span>{release.receiving_party_organization}</span>
                    )}
                    <span className="capitalize">{release.release_type?.replace('_',' ')}</span>
                    {release.release_datetime && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Released: {format(new Date(release.release_datetime), 'MMM d, yyyy HH:mm')}
                      </span>
                    )}
                  </div>
                  {release.notes && <p className="text-xs text-muted-foreground mt-1.5 italic">{release.notes}</p>}
                </div>
                <div className="shrink-0">
                  {release.status === 'verification_in_progress' && (
                    <Button size="sm" onClick={() => handleApprove(release)} className="gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve Release
                    </Button>
                  )}
                  {release.status === 'completed' && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />Released
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}