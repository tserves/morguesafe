import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Pencil } from 'lucide-react';

const FIELD_LABELS = {
  full_name: 'Full Name',
  baby_name: 'Baby Name',
  age: 'Age',
  sex: 'Sex',
  date_of_birth: 'Date of Birth',
  mrn: 'MRN / Hospital Number',
  arrival_datetime: 'Arrival Date & Time',
  ward: 'Ward / Unit',
  referral_source: 'Referral Source',
  referral_contact: 'Referral Contact',
  mother_name: "Mother's Name",
  mother_mrn: "Mother's MRN",
  mother_dob: "Mother's Date of Birth",
  delivery_unit: 'Delivery Unit',
  transported_by: 'Transported By',
  reference_number: 'Reference Number',
  contact_details: 'Contact Details',
  notes: 'Notes',
  effects_description: 'Personal Effects',
  attending_staff: 'Attending Staff',
  brought_in_by: 'Brought In By',
  received_by: 'Received By',
  gestational_age: 'Gestational Age',
};

function ConfidenceBadge({ value }) {
  const color = value >= 80 ? 'bg-green-100 text-green-700' : value >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  const label = value >= 80 ? 'High' : value >= 50 ? 'Medium' : 'Low';
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${color}`}>{label} {value}%</span>;
}

export default function AutofillReviewModal({ open, onClose, extractedData, formData, summary, onApply }) {
  const [decisions, setDecisions] = useState(() => {
    const d = {};
    (extractedData || []).forEach(f => { d[f.field] = { status: 'pending', editedValue: f.value }; });
    return d;
  });

  const decide = (field, status) => setDecisions(d => ({ ...d, [field]: { ...d[field], status } }));
  const edit = (field, value) => setDecisions(d => ({ ...d, [field]: { ...d[field], editedValue: value, status: 'accepted' } }));

  const handleApply = () => {
    const accepted = {};
    (extractedData || []).forEach(f => {
      const d = decisions[f.field];
      if (d?.status === 'accepted') {
        accepted[f.field] = d.editedValue || f.value;
      }
    });
    onApply(accepted);
    onClose();
  };

  const acceptedCount = Object.values(decisions).filter(d => d.status === 'accepted').length;
  const fields = extractedData || [];

  const acceptAll = () => {
    const d = {};
    fields.forEach(f => { d[f.field] = { status: 'accepted', editedValue: f.value }; });
    setDecisions(d);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Extracted Data</DialogTitle>
        </DialogHeader>

        {summary && (
          <div className="bg-muted/60 rounded-lg p-3 text-xs text-muted-foreground shrink-0">
            <strong>Document summary:</strong> {summary}
          </div>
        )}

        {fields.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No data could be extracted from the uploaded files.
          </div>
        )}

        {fields.length > 0 && (
          <>
            <div className="flex items-center justify-between shrink-0">
              <p className="text-xs text-muted-foreground">{fields.length} field{fields.length > 1 ? 's' : ''} extracted — review each one</p>
              <button className="text-xs text-primary underline" onClick={acceptAll}>Accept all</button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {fields.map((f) => {
                const d = decisions[f.field] || { status: 'pending', editedValue: f.value };
                const existingVal = formData?.[f.field];
                const hasExisting = existingVal && String(existingVal).trim() !== '';
                const isEditing = d.status === 'accepted';

                return (
                  <div key={f.field} className={`border rounded-xl p-3 transition-colors ${
                    d.status === 'accepted' ? 'border-green-300 bg-green-50/50' :
                    d.status === 'rejected' ? 'border-muted bg-muted/30 opacity-50' :
                    'border-border bg-card'
                  }`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">{FIELD_LABELS[f.field] || f.label || f.field}</span>
                        <ConfidenceBadge value={Math.round(f.confidence || 0)} />
                      </div>
                      {d.status === 'pending' && (
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => decide(f.field, 'accepted')} className="w-7 h-7 rounded-lg bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors">
                            <Check className="w-3.5 h-3.5 text-green-700" />
                          </button>
                          <button onClick={() => decide(f.field, 'rejected')} className="w-7 h-7 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors">
                            <X className="w-3.5 h-3.5 text-red-700" />
                          </button>
                        </div>
                      )}
                      {d.status === 'accepted' && (
                        <button onClick={() => decide(f.field, 'pending')} className="text-[10px] text-muted-foreground underline shrink-0">Undo</button>
                      )}
                      {d.status === 'rejected' && (
                        <button onClick={() => decide(f.field, 'pending')} className="text-[10px] text-muted-foreground underline shrink-0">Undo</button>
                      )}
                    </div>

                    {hasExisting && d.status !== 'rejected' && (
                      <p className="text-[10px] text-amber-600 mb-1">⚠ Existing: <em>{String(existingVal)}</em></p>
                    )}

                    {d.status === 'accepted' ? (
                      <Input
                        className="h-7 text-xs"
                        value={d.editedValue}
                        onChange={e => edit(f.field, e.target.value)}
                      />
                    ) : d.status === 'rejected' ? (
                      <p className="text-xs text-muted-foreground line-through">{f.value}</p>
                    ) : (
                      <p className="text-xs text-foreground font-medium">{f.value}</p>
                    )}

                    {f.source_note && d.status !== 'rejected' && (
                      <p className="text-[10px] text-muted-foreground mt-1">{f.source_note}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 shrink-0 pt-2 border-t">
              <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              <Button onClick={handleApply} className="flex-1" disabled={acceptedCount === 0}>
                Apply {acceptedCount} field{acceptedCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </>
        )}

        {fields.length === 0 && (
          <Button onClick={onClose} className="shrink-0">Close</Button>
        )}
      </DialogContent>
    </Dialog>
  );
}