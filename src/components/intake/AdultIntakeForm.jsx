import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, CheckCircle, Printer } from 'lucide-react';
import { format } from 'date-fns';
import PersonalEffectsSection from './PersonalEffectsSection';
import IntakePrintModal from './IntakePrintModal';

function generateUniqueId() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `MS-${year}-${rand}`;
}

export default function AdultIntakeForm({ onBack }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedDecedent, setSavedDecedent] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [form, setForm] = useState({
    unique_id: generateUniqueId(),
    full_name: '',
    age: '',
    sex: '',
    mrn: '',
    arrival_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    ward: '',
    brought_in_by: '',
    received_by: '',
    id_band_confirmed: '',
    notes: '',
  });
  const [effects, setEffects] = useState({ present: 'no' });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    const nameParts = (form.full_name || '').trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    const decedent = await base44.entities.Decedent.create({
      unique_id: form.unique_id,
      first_name,
      last_name,
      estimated_age: form.age ? Number(form.age) : undefined,
      gender: form.sex || 'unknown',
      case_number: form.mrn,
      source_type: 'hospital',
      source_name: form.ward,
      hospital_floor: form.ward,
      arrival_datetime: form.arrival_datetime,
      intake_officer: form.received_by,
      notes: form.notes,
      identification_status: form.id_band_confirmed === 'yes' ? 'identified' : 'pending_verification',
      status: 'intake',
      is_donor: 'unknown',
    });

    await base44.entities.CustodyLog.create({
      decedent_id: decedent.id,
      decedent_unique_id: decedent.unique_id,
      action_type: 'intake',
      to_location: form.ward || 'Intake Bay',
      performed_by: form.received_by || 'System',
      performed_by_role: 'Intake Staff',
      timestamp: new Date().toISOString(),
      notes: `Adult intake. Brought in by: ${form.brought_in_by || 'N/A'}. Ward: ${form.ward || 'N/A'}.`,
      verification_method: 'manual',
    });

    if (effects.present === 'yes') {
      await base44.entities.PersonalEffect.create({
        decedent_id: decedent.id,
        decedent_unique_id: decedent.unique_id,
        item_name: effects.description || 'Personal effects',
        description: effects.description || '',
        quantity: effects.quantity ? Number(effects.quantity) : 1,
        condition: effects.condition || '',
        storage_location: effects.bag_number || '',
        logged_by: effects.received_by || form.received_by || 'System',
        status: 'logged',
        notes: effects.notes || '',
        category: 'other',
        photos: effects.photo_url ? [effects.photo_url] : [],
      });
    }

    setSavedDecedent(decedent);
    setSaving(false);
    setSaved(true);
  };

  if (saved && savedDecedent) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold">Adult Intake Recorded</h2>
          <p className="text-sm text-muted-foreground mt-1">Case ID: {savedDecedent.unique_id}</p>
          <div className="flex gap-3 mt-6 w-full max-w-xs">
            <Button variant="outline" className="flex-1" onClick={() => setShowPrint(true)}>
              <Printer className="w-4 h-4 mr-2" /> Print Labels
            </Button>
            <Button className="flex-1" onClick={() => navigate(`/decedent/${savedDecedent.id}`)}>
              Open Case
            </Button>
          </div>
        </div>
        <IntakePrintModal
          open={showPrint}
          onClose={() => setShowPrint(false)}
          decedentId={savedDecedent.id}
          uniqueId={savedDecedent.unique_id}
          bagNumber={effects.bag_number}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-xl font-semibold">Adult Intake</h1>
          <p className="text-xs text-muted-foreground font-mono">{form.unique_id}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input className="mt-1.5" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="If known" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Age</Label>
              <Input type="number" className="mt-1.5" value={form.age} onChange={e => set('age', e.target.value)} placeholder="Years" />
            </div>
            <div>
              <Label>Sex</Label>
              <Select value={form.sex} onValueChange={v => set('sex', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>MRN / Hospital Number</Label>
            <Input className="mt-1.5" value={form.mrn} onChange={e => set('mrn', e.target.value)} placeholder="e.g. MRN-00123" />
          </div>
          <div>
            <Label>Date & Time of Arrival *</Label>
            <Input type="datetime-local" className="mt-1.5" value={form.arrival_datetime} onChange={e => set('arrival_datetime', e.target.value)} />
          </div>
          <div>
            <Label>Ward / Unit / Department</Label>
            <Input className="mt-1.5" value={form.ward} onChange={e => set('ward', e.target.value)} placeholder="e.g. ICU, Surgical Ward" />
          </div>
          <div>
            <Label>Brought In By</Label>
            <Input className="mt-1.5" value={form.brought_in_by} onChange={e => set('brought_in_by', e.target.value)} placeholder="Name or department" />
          </div>
          <div>
            <Label>Received By *</Label>
            <Input className="mt-1.5" value={form.received_by} onChange={e => set('received_by', e.target.value)} placeholder="Officer / staff name" />
          </div>
          <div>
            <Label>Identification Band Confirmed?</Label>
            <Select value={form.id_band_confirmed} onValueChange={v => set('id_band_confirmed', v)}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="absent">Band Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea className="mt-1.5" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." />
          </div>
        </div>

        <PersonalEffectsSection effects={effects} onChange={setEffects} />

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={saving || !form.arrival_datetime || !form.received_by}
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Complete Adult Intake'}
        </Button>
      </div>
    </div>
  );
}