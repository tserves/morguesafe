import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, CheckCircle, Printer, ClipboardList, Upload } from 'lucide-react';
import { format } from 'date-fns';
import PersonalEffectsSection from './PersonalEffectsSection';
import IntakePrintModal from './IntakePrintModal';
import DocumentUploadTab from './DocumentUploadTab';
import AutofillReviewModal from './AutofillReviewModal';

function generateUniqueId() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `MS-${year}-${rand}`;
}

const TABS = [
  { id: 'form', label: 'Intake Form', icon: ClipboardList },
  { id: 'upload', label: 'Documents', icon: Upload },
];

export default function BabyIntakeForm({ onBack }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('form');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedDecedent, setSavedDecedent] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [scanSummary, setScanSummary] = useState('');
  const [form, setForm] = useState({
    unique_id: generateUniqueId(),
    baby_name: '',
    sex: '',
    arrival_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    gestational_age: '',
    mother_name: '',
    mother_mrn: '',
    mother_dob: '',
    delivery_unit: '',
    attending_staff: '',
    id_band_details: '',
    notes: '',
  });
  const [effects, setEffects] = useState({ present: 'no' });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleScanResult = (fields, summary) => {
    setScanResult(fields);
    setScanSummary(summary);
  };

  const handleApplyAutofill = (accepted) => {
    setForm(f => {
      const updated = { ...f };
      Object.entries(accepted).forEach(([key, value]) => {
        if (key in updated) updated[key] = value;
      });
      return updated;
    });
    if (accepted.effects_description) {
      setEffects(e => ({ ...e, present: 'yes', description: accepted.effects_description }));
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    const babyNotes = [
      form.gestational_age ? `Gestational age: ${form.gestational_age}` : '',
      form.mother_name ? `Mother: ${form.mother_name}` : '',
      form.mother_mrn ? `Mother MRN: ${form.mother_mrn}` : '',
      form.mother_dob ? `Mother DOB: ${form.mother_dob}` : '',
      form.attending_staff ? `Attending: ${form.attending_staff}` : '',
      form.id_band_details ? `ID Band: ${form.id_band_details}` : '',
      form.notes || '',
    ].filter(Boolean).join(' | ');

    const allDocUrls = uploadedFiles.map(f => f.url);

    const decedent = await base44.entities.Decedent.create({
      unique_id: form.unique_id,
      first_name: form.baby_name || 'Baby',
      last_name: form.mother_name ? `(of ${form.mother_name})` : '',
      gender: form.sex || 'unknown',
      source_type: 'hospital',
      source_name: form.delivery_unit,
      hospital_floor: form.delivery_unit,
      arrival_datetime: form.arrival_datetime,
      intake_officer: form.attending_staff,
      notes: babyNotes,
      identification_status: 'pending_verification',
      status: 'intake',
      is_donor: 'no',
      flags: ['BABY / NEONATE'],
      documents: allDocUrls,
    });

    await base44.entities.CustodyLog.create({
      decedent_id: decedent.id,
      decedent_unique_id: decedent.unique_id,
      action_type: 'intake',
      to_location: form.delivery_unit || 'Intake Bay',
      performed_by: form.attending_staff || 'System',
      performed_by_role: 'Intake Staff',
      timestamp: new Date().toISOString(),
      notes: `Baby intake from ${form.delivery_unit || 'N/A'}. Mother: ${form.mother_name || 'N/A'}. Documents: ${uploadedFiles.length}.`,
      verification_method: 'manual',
    });

    if (effects.present === 'yes') {
      const effectPhotos = uploadedFiles.filter(f => f.tag === 'effects_photo').map(f => f.url);
      if (effects.photo_url) effectPhotos.push(effects.photo_url);
      await base44.entities.PersonalEffect.create({
        decedent_id: decedent.id,
        decedent_unique_id: decedent.unique_id,
        item_name: effects.description || 'Personal effects',
        description: effects.description || '',
        quantity: effects.quantity ? Number(effects.quantity) : 1,
        condition: effects.condition || '',
        storage_location: effects.bag_number || '',
        logged_by: effects.received_by || form.attending_staff || 'System',
        status: 'logged',
        notes: effects.notes || '',
        category: 'other',
        photos: effectPhotos,
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
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold">Baby Intake Recorded</h2>
          <p className="text-sm text-muted-foreground mt-1">Case ID: {savedDecedent.unique_id}</p>
          {uploadedFiles.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{uploadedFiles.length} document{uploadedFiles.length > 1 ? 's' : ''} attached</p>
          )}
          <div className="flex gap-3 mt-6 w-full max-w-xs">
            <Button variant="outline" className="flex-1" onClick={() => setShowPrint(true)}>
              <Printer className="w-4 h-4 mr-2" /> Print Labels
            </Button>
            <Button className="flex-1" onClick={() => navigate(`/decedent/${savedDecedent.id}`)}>
              Open Case
            </Button>
          </div>
        </div>
        <IntakePrintModal open={showPrint} onClose={() => setShowPrint(false)} decedentId={savedDecedent.id} uniqueId={savedDecedent.unique_id} bagNumber={effects.bag_number} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-xl font-semibold">Baby Intake</h1>
          <p className="text-xs text-muted-foreground font-mono">{form.unique_id}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border rounded-lg overflow-hidden mb-5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${tab === id ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {id === 'upload' && uploadedFiles.length > 0 && (
              <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${tab === id ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>{uploadedFiles.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'upload' && (
        <div className="space-y-4">
          <DocumentUploadTab files={uploadedFiles} onFilesChange={setUploadedFiles} onScanResult={handleScanResult} intakeType="baby" />
          {scanResult && (
            <AutofillReviewModal open={true} onClose={() => setScanResult(null)} extractedData={scanResult} formData={form} summary={scanSummary} onApply={handleApplyAutofill} />
          )}
        </div>
      )}

      {tab === 'form' && (
        <div className="space-y-4">
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <div>
              <Label>Baby Name (if available)</Label>
              <Input className="mt-1.5" value={form.baby_name} onChange={e => set('baby_name', e.target.value)} placeholder="If known" />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label>Gestational Age</Label>
                <Input className="mt-1.5" value={form.gestational_age} onChange={e => set('gestational_age', e.target.value)} placeholder="e.g. 28 weeks" />
              </div>
            </div>
            <div>
              <Label>Date & Time of Arrival *</Label>
              <Input type="datetime-local" className="mt-1.5" value={form.arrival_datetime} onChange={e => set('arrival_datetime', e.target.value)} />
            </div>
            <div>
              <Label>Mother's Full Name</Label>
              <Input className="mt-1.5" value={form.mother_name} onChange={e => set('mother_name', e.target.value)} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mother's MRN</Label>
                <Input className="mt-1.5" value={form.mother_mrn} onChange={e => set('mother_mrn', e.target.value)} placeholder="Hospital number" />
              </div>
              <div>
                <Label>Mother's Date of Birth</Label>
                <Input type="date" className="mt-1.5" value={form.mother_dob} onChange={e => set('mother_dob', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Delivery Unit / Ward</Label>
              <Input className="mt-1.5" value={form.delivery_unit} onChange={e => set('delivery_unit', e.target.value)} placeholder="e.g. Labour Ward, NICU" />
            </div>
            <div>
              <Label>Attending Doctor / Nurse (optional)</Label>
              <Input className="mt-1.5" value={form.attending_staff} onChange={e => set('attending_staff', e.target.value)} placeholder="Name" />
            </div>
            <div>
              <Label>ID Band Details (optional)</Label>
              <Input className="mt-1.5" value={form.id_band_details} onChange={e => set('id_band_details', e.target.value)} placeholder="Band number / description" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea className="mt-1.5" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." />
            </div>
          </div>

          <PersonalEffectsSection effects={effects} onChange={setEffects} />

          <Button className="w-full" onClick={handleSubmit} disabled={saving || !form.arrival_datetime}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Complete Baby Intake'}
          </Button>
        </div>
      )}
    </div>
  );
}