import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertCircle, Loader2, ClipboardList, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

function generateUniqueId() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `MS-${year}-${rand}`;
}

const steps = [
  { label: 'Source Info', desc: 'Where the case originated' },
  { label: 'Identity',    desc: 'Personal identification' },
  { label: 'Physical',    desc: 'Physical characteristics' },
  { label: 'Assignment',  desc: 'Final review & submit' },
];

const stepColors = ['bg-indigo-600', 'bg-violet-600', 'bg-sky-600', 'bg-emerald-600'];

export default function BodyIntake() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    unique_id: generateUniqueId(),
    source_type: '', source_name: '', source_contact: '',
    arrival_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    condition_on_arrival: '', condition_notes: '',
    first_name: '', last_name: '', date_of_birth: '', gender: '',
    estimated_age: '', identification_status: 'pending_verification',
    physical_description: '', identifying_marks: '',
    height_cm: '', weight_kg: '',
    case_number: '', law_enforcement_case: '',
    next_of_kin_name: '', next_of_kin_contact: '', next_of_kin_relationship: '',
    intake_officer: '', requires_autopsy: false, notes: '', status: 'intake', flags: [],
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
      decedent_id: decedent.id, decedent_unique_id: decedent.unique_id,
      action_type: 'intake', to_location: 'Intake Bay',
      performed_by: form.intake_officer || 'System', performed_by_role: 'Intake Staff',
      timestamp: new Date().toISOString(),
      notes: `Initial intake from ${form.source_name || form.source_type}`,
      verification_method: 'manual',
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate(`/decedent/${decedent.id}`), 1800);
  };

  if (saved) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-center animate-fade-in-up">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-float">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Intake Recorded</h2>
          <p className="text-slate-500 mb-4">Redirecting to case file...</p>
          <div className="inline-flex items-center gap-2 font-mono text-sm bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-xl font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> {form.unique_id}
          </div>
        </div>
      </div>
    );
  }

  const fieldClass = "mt-1.5 h-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400 transition-colors";
  const textareaClass = "mt-1.5 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400 transition-colors";
  const labelClass = "text-xs font-semibold text-slate-600 uppercase tracking-wide";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Body Intake"
        subtitle="Register a new case into the system"
        badge={form.unique_id}
      />

      {/* Progress steps */}
      <div className="mb-8">
        <div className="flex items-center gap-0 mb-4 relative">
          <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-slate-200 z-0" />
          {steps.map((s, i) => (
            <div key={i} className="flex-1 relative z-10">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border-2 ${
                    i < step ? 'bg-emerald-500 border-emerald-500 text-white' :
                    i === step ? `${stepColors[i]} border-transparent text-white shadow-glow-indigo` :
                    'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 text-center">
              <p className={`text-[11px] font-semibold ${i === step ? 'text-indigo-700' : i < step ? 'text-emerald-600' : 'text-slate-400'}`}>{s.label}</p>
              {i === step && <p className="text-[10px] text-slate-400 mt-0.5">{s.desc}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className={`h-1 ${stepColors[step]} transition-all`} />
        <div className="p-6 space-y-5">
          {step === 0 && (
            <>
              <div>
                <Label className={labelClass}>Source Type *</Label>
                <Select value={form.source_type} onValueChange={v => set('source_type', v)}>
                  <SelectTrigger className={fieldClass}><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {['hospital','law_enforcement','scene','funeral_home','other'].map(v => (
                      <SelectItem key={v} value={v}>{v.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>Source Name / Institution</Label>
                  <Input className={fieldClass} value={form.source_name} onChange={e => set('source_name', e.target.value)} placeholder="e.g. City General Hospital" />
                </div>
                <div>
                  <Label className={labelClass}>Source Contact</Label>
                  <Input className={fieldClass} value={form.source_contact} onChange={e => set('source_contact', e.target.value)} placeholder="Phone or email" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>Arrival Date & Time *</Label>
                  <Input type="datetime-local" className={fieldClass} value={form.arrival_datetime} onChange={e => set('arrival_datetime', e.target.value)} />
                </div>
                <div>
                  <Label className={labelClass}>Intake Officer</Label>
                  <Input className={fieldClass} value={form.intake_officer} onChange={e => set('intake_officer', e.target.value)} placeholder="Officer name" />
                </div>
              </div>
              <div>
                <Label className={labelClass}>Condition on Arrival *</Label>
                <Select value={form.condition_on_arrival} onValueChange={v => set('condition_on_arrival', v)}>
                  <SelectTrigger className={fieldClass}><SelectValue placeholder="Select condition" /></SelectTrigger>
                  <SelectContent>
                    {['intact','decomposed','traumatic_injuries','burned','skeletal','other'].map(v => (
                      <SelectItem key={v} value={v}>{v.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className={labelClass}>First Name</Label><Input className={fieldClass} value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="If known" /></div>
                <div><Label className={labelClass}>Last Name</Label><Input className={fieldClass} value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="If known" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className={labelClass}>Date of Birth</Label><Input type="date" className={fieldClass} value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></div>
                <div><Label className={labelClass}>Estimated Age</Label><Input type="number" className={fieldClass} value={form.estimated_age} onChange={e => set('estimated_age', e.target.value)} placeholder="Years" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>Gender</Label>
                  <Select value={form.gender} onValueChange={v => set('gender', v)}>
                    <SelectTrigger className={fieldClass}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['male','female','unknown','other'].map(v => <SelectItem key={v} value={v}>{v.replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClass}>Identification Status</Label>
                  <Select value={form.identification_status} onValueChange={v => set('identification_status', v)}>
                    <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="identified">Identified</SelectItem>
                      <SelectItem value="unidentified">Unidentified</SelectItem>
                      <SelectItem value="pending_verification">Pending Verification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className={labelClass}>Case / Reference Number</Label><Input className={fieldClass} value={form.case_number} onChange={e => set('case_number', e.target.value)} placeholder="Internal case #" /></div>
                <div><Label className={labelClass}>Law Enforcement Case #</Label><Input className={fieldClass} value={form.law_enforcement_case} onChange={e => set('law_enforcement_case', e.target.value)} placeholder="Police case #" /></div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className={labelClass}>Height (cm)</Label><Input type="number" className={fieldClass} value={form.height_cm} onChange={e => set('height_cm', e.target.value)} /></div>
                <div><Label className={labelClass}>Weight (kg)</Label><Input type="number" className={fieldClass} value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} /></div>
              </div>
              <div>
                <Label className={labelClass}>Physical Description</Label>
                <Textarea className={textareaClass} value={form.physical_description} onChange={e => set('physical_description', e.target.value)} placeholder="Build, hair color, skin tone, notable features..." rows={3} />
              </div>
              <div>
                <Label className={labelClass}>Identifying Marks / Tattoos / Scars</Label>
                <Textarea className={textareaClass} value={form.identifying_marks} onChange={e => set('identifying_marks', e.target.value)} placeholder="Describe any marks for identification..." rows={3} />
              </div>
              <div>
                <Label className={labelClass}>Additional Notes</Label>
                <Textarea className={textareaClass} value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {/* Checklist */}
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-4 mb-2">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList className="w-4 h-4 text-indigo-600" />
                  <p className="text-sm font-bold text-indigo-800">Intake Checklist</p>
                </div>
                <div className="space-y-2">
                  {[
                    { key: 'source_type', label: 'Source documented' },
                    { key: 'condition_on_arrival', label: 'Condition recorded' },
                    { key: 'identification_status', label: 'ID status set' },
                    { key: 'intake_officer', label: 'Officer assigned' },
                  ].map(({ key, label }) => (
                    <div key={key} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${form[key] ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                      {form[key] ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className={`text-sm font-medium ${form[key] ? 'text-emerald-700' : 'text-amber-700'}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><Label className={labelClass}>Next of Kin Name</Label><Input className={fieldClass} value={form.next_of_kin_name} onChange={e => set('next_of_kin_name', e.target.value)} /></div>
                <div><Label className={labelClass}>Relationship</Label><Input className={fieldClass} value={form.next_of_kin_relationship} onChange={e => set('next_of_kin_relationship', e.target.value)} /></div>
              </div>
              <div>
                <Label className={labelClass}>Next of Kin Contact</Label>
                <Input className={fieldClass} value={form.next_of_kin_contact} onChange={e => set('next_of_kin_contact', e.target.value)} />
              </div>
              <div className="flex items-center gap-3 pt-1 px-1">
                <div className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${form.requires_autopsy ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  onClick={() => set('requires_autopsy', !form.requires_autopsy)}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${form.requires_autopsy ? 'left-5' : 'left-1'}`} />
                </div>
                <Label className="cursor-pointer text-sm font-semibold text-slate-700" onClick={() => set('requires_autopsy', !form.requires_autopsy)}>
                  Autopsy Required
                </Label>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-2 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 h-10">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)} className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 font-semibold shadow-sm"
            disabled={step === 0 && !form.source_type}>
            Continue <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-semibold shadow-sm"
            disabled={saving || !form.source_type}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle className="w-4 h-4" /> Complete Intake</>}
          </Button>
        )}
      </div>
    </div>
  );
}