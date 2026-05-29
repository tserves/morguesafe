import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertCircle, Loader2, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

function generateUniqueId() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `MS-${year}-${rand}`;
}

const steps = ['Source Info', 'Identity', 'Physical', 'Assignment'];

export default function BodyIntake() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    unique_id: generateUniqueId(),
    source_type: '',
    source_name: '',
    source_contact: '',
    arrival_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    condition_on_arrival: '',
    condition_notes: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    estimated_age: '',
    identification_status: 'pending_verification',
    physical_description: '',
    identifying_marks: '',
    height_cm: '',
    weight_kg: '',
    case_number: '',
    law_enforcement_case: '',
    next_of_kin_name: '',
    next_of_kin_contact: '',
    next_of_kin_relationship: '',
    intake_officer: '',
    requires_autopsy: false,
    notes: '',
    status: 'intake',
    flags: [],
  });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    const decedent = await base44.entities.Decedent.create({
      ...form,
      estimated_age: form.estimated_age ? Number(form.estimated_age) : undefined,
      height_cm: form.height_cm ? Number(form.height_cm) : undefined,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
    });

    await base44.entities.CustodyLog.create({
      decedent_id: decedent.id,
      decedent_unique_id: decedent.unique_id,
      action_type: 'intake',
      to_location: 'Intake Bay',
      performed_by: form.intake_officer || 'System',
      performed_by_role: 'Intake Staff',
      timestamp: new Date().toISOString(),
      notes: `Initial intake from ${form.source_name || form.source_type}`,
      verification_method: 'manual',
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate(`/decedent/${decedent.id}`), 1500);
  };

  if (saved) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Intake Recorded</h2>
        <p className="text-sm text-muted-foreground mt-1">Redirecting to case file...</p>
        <p className="font-mono text-sm mt-2 bg-muted px-3 py-1 rounded">{form.unique_id}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Body Intake"
        subtitle={`Case ID: ${form.unique_id}`}
        actions={
          <span className="text-xs font-mono bg-muted px-3 py-1.5 rounded-full text-muted-foreground">
            Step {step + 1} of {steps.length}
          </span>
        }
      />

      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
            <p className={`text-[10px] mt-1.5 font-medium transition-colors ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border rounded-xl p-6 space-y-5">
        {step === 0 && (
          <>
            <div>
              <Label>Source Type *</Label>
              <Select value={form.source_type} onValueChange={v => set('source_type', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  {['hospital','law_enforcement','scene','funeral_home','other'].map(v => (
                    <SelectItem key={v} value={v}>{v.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source Name / Institution</Label>
              <Input className="mt-1.5" value={form.source_name} onChange={e => set('source_name', e.target.value)} placeholder="e.g. City General Hospital" />
            </div>
            <div>
              <Label>Source Contact</Label>
              <Input className="mt-1.5" value={form.source_contact} onChange={e => set('source_contact', e.target.value)} placeholder="Phone or email" />
            </div>
            <div>
              <Label>Arrival Date & Time *</Label>
              <Input type="datetime-local" className="mt-1.5" value={form.arrival_datetime} onChange={e => set('arrival_datetime', e.target.value)} />
            </div>
            <div>
              <Label>Condition on Arrival *</Label>
              <Select value={form.condition_on_arrival} onValueChange={v => set('condition_on_arrival', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  {['intact','decomposed','traumatic_injuries','burned','skeletal','other'].map(v => (
                    <SelectItem key={v} value={v}>{v.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Intake Officer</Label>
              <Input className="mt-1.5" value={form.intake_officer} onChange={e => set('intake_officer', e.target.value)} placeholder="Officer name" />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input className="mt-1.5" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="If known" />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input className="mt-1.5" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="If known" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" className="mt-1.5" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
              </div>
              <div>
                <Label>Estimated Age</Label>
                <Input type="number" className="mt-1.5" value={form.estimated_age} onChange={e => set('estimated_age', e.target.value)} placeholder="Years" />
              </div>
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={v => set('gender', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  {['male','female','unknown','other'].map(v => (
                    <SelectItem key={v} value={v}>{v.replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Identification Status</Label>
              <Select value={form.identification_status} onValueChange={v => set('identification_status', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="identified">Identified</SelectItem>
                  <SelectItem value="unidentified">Unidentified</SelectItem>
                  <SelectItem value="pending_verification">Pending Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Case / Reference Number</Label>
              <Input className="mt-1.5" value={form.case_number} onChange={e => set('case_number', e.target.value)} placeholder="Internal case number" />
            </div>
            <div>
              <Label>Law Enforcement Case #</Label>
              <Input className="mt-1.5" value={form.law_enforcement_case} onChange={e => set('law_enforcement_case', e.target.value)} placeholder="Police case number" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Height (cm)</Label>
                <Input type="number" className="mt-1.5" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} />
              </div>
              <div>
                <Label>Weight (kg)</Label>
                <Input type="number" className="mt-1.5" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Physical Description</Label>
              <Textarea className="mt-1.5" value={form.physical_description} onChange={e => set('physical_description', e.target.value)} placeholder="Build, hair color, skin tone, notable features..." rows={3} />
            </div>
            <div>
              <Label>Identifying Marks / Tattoos / Scars</Label>
              <Textarea className="mt-1.5" value={form.identifying_marks} onChange={e => set('identifying_marks', e.target.value)} placeholder="Describe any marks for identification..." rows={3} />
            </div>
            <div>
              <Label>Additional Notes</Label>
              <Textarea className="mt-1.5" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="bg-muted/50 rounded-lg p-4 mb-2">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Intake Checklist</p>
              </div>
              {[
                { key: 'source_type', label: 'Source documented' },
                { key: 'condition_on_arrival', label: 'Condition recorded' },
                { key: 'identification_status', label: 'ID status set' },
                { key: 'intake_officer', label: 'Officer assigned' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2 py-1">
                  {form[key] ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                  <span className={`text-sm ${form[key] ? 'text-foreground' : 'text-amber-700'}`}>{label}</span>
                </div>
              ))}
            </div>
            <div>
              <Label>Next of Kin Name</Label>
              <Input className="mt-1.5" value={form.next_of_kin_name} onChange={e => set('next_of_kin_name', e.target.value)} />
            </div>
            <div>
              <Label>Next of Kin Contact</Label>
              <Input className="mt-1.5" value={form.next_of_kin_contact} onChange={e => set('next_of_kin_contact', e.target.value)} />
            </div>
            <div>
              <Label>Next of Kin Relationship</Label>
              <Input className="mt-1.5" value={form.next_of_kin_relationship} onChange={e => set('next_of_kin_relationship', e.target.value)} />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input type="checkbox" id="autopsy" checked={form.requires_autopsy} onChange={e => set('requires_autopsy', e.target.checked)} className="w-4 h-4 rounded" />
              <Label htmlFor="autopsy" className="cursor-pointer">Autopsy Required</Label>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
            Back
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)} className="flex-1" disabled={step === 0 && !form.source_type}>
            Continue
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="flex-1" disabled={saving || !form.source_type}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Complete Intake'}
          </Button>
        )}
      </div>
    </div>
  );
}