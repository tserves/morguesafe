import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ORGANS = [
  { key: 'heart', label: 'Heart' },
  { key: 'lungs', label: 'Lungs' },
  { key: 'liver', label: 'Liver' },
  { key: 'kidneys', label: 'Kidneys' },
  { key: 'pancreas', label: 'Pancreas' },
  { key: 'intestines', label: 'Intestines' },
  { key: 'corneas', label: 'Corneas' },
  { key: 'other', label: 'Other' },
];

const TISSUES = [
  { key: 'skin', label: 'Skin' },
  { key: 'bone', label: 'Bone' },
  { key: 'tendons', label: 'Tendons' },
  { key: 'ligaments', label: 'Ligaments' },
  { key: 'heart_valves', label: 'Heart Valves' },
  { key: 'veins', label: 'Veins' },
  { key: 'cartilage', label: 'Cartilage' },
  { key: 'other', label: 'Other' },
];

function CheckGrid({ items, selected = [], onToggle }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map(({ key, label }) => {
        const checked = selected.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className={cn(
              'text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all',
              checked
                ? 'bg-red-50 border-red-400 text-red-700'
                : 'bg-card border-border text-muted-foreground hover:border-red-200 hover:bg-red-50/50'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function DonationStep({ form, set }) {
  const isDonor = form.is_donor === 'yes';

  const toggleOrgan = (key) => {
    const current = form.organs_for_donation || [];
    set('organs_for_donation', current.includes(key) ? current.filter(x => x !== key) : [...current, key]);
  };

  const toggleTissue = (key) => {
    const current = form.tissues_for_donation || [];
    set('tissues_for_donation', current.includes(key) ? current.filter(x => x !== key) : [...current, key]);
  };

  return (
    <div className="space-y-5">
      {/* Donor Status */}
      <div className="flex items-center gap-2 mb-1">
        <Heart className="w-4 h-4 text-red-500" />
        <p className="text-sm font-semibold text-foreground">Organ & Tissue Donation Screening</p>
        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Required</span>
      </div>

      <div>
        <Label>Is the deceased a registered organ and/or tissue donor? *</Label>
        <div className="flex gap-3 mt-2">
          {['yes', 'no', 'unknown'].map(v => (
            <button
              key={v}
              type="button"
              onClick={() => set('is_donor', v)}
              className={cn(
                'flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all capitalize',
                form.is_donor === v
                  ? v === 'yes'
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : v === 'no'
                      ? 'bg-slate-100 border-slate-400 text-slate-700'
                      : 'bg-amber-50 border-amber-400 text-amber-700'
                  : 'border-border text-muted-foreground hover:border-primary/30'
              )}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isDonor && (
        <>
          {/* High Priority Notice */}
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-medium">
              This case will be flagged as <strong>DONOR CASE — HIGH PRIORITY</strong>. Designated coordinators will be notified and release of remains will be restricted until donation status is resolved.
            </p>
          </div>

          {/* Registration */}
          <div className="border rounded-xl p-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Donation Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Donor Registration Number</Label>
                <Input className="mt-1.5" value={form.donor_registration_number || ''} onChange={e => set('donor_registration_number', e.target.value)} placeholder="If available" />
              </div>
              <div>
                <Label>Donor Card Verified</Label>
                <Select value={form.donor_card_verified || ''} onValueChange={v => set('donor_card_verified', v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Verification Method</Label>
                <Input className="mt-1.5" value={form.donor_verification_method || ''} onChange={e => set('donor_verification_method', e.target.value)} placeholder="e.g. ID card, registry check" />
              </div>
              <div>
                <Label>Donation Organization/Agency</Label>
                <Input className="mt-1.5" value={form.donation_organization || ''} onChange={e => set('donation_organization', e.target.value)} placeholder="Organization name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Coordinator Name</Label>
                <Input className="mt-1.5" value={form.donation_coordinator_name || ''} onChange={e => set('donation_coordinator_name', e.target.value)} />
              </div>
              <div>
                <Label>Coordinator Contact</Label>
                <Input className="mt-1.5" value={form.donation_coordinator_contact || ''} onChange={e => set('donation_coordinator_contact', e.target.value)} placeholder="Phone or email" />
              </div>
            </div>
          </div>

          {/* Organs */}
          <div className="border rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Organ Donation</p>
            <CheckGrid items={ORGANS} selected={form.organs_for_donation || []} onToggle={toggleOrgan} />
            {(form.organs_for_donation || []).includes('other') && (
              <div>
                <Label>Specify other organ(s)</Label>
                <Input className="mt-1.5" value={form.organs_other_specify || ''} onChange={e => set('organs_other_specify', e.target.value)} />
              </div>
            )}
          </div>

          {/* Tissues */}
          <div className="border rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tissue Donation</p>
            <CheckGrid items={TISSUES} selected={form.tissues_for_donation || []} onToggle={toggleTissue} />
            {(form.tissues_for_donation || []).includes('other') && (
              <div>
                <Label>Specify other tissue(s)</Label>
                <Input className="mt-1.5" value={form.tissues_other_specify || ''} onChange={e => set('tissues_other_specify', e.target.value)} />
              </div>
            )}
          </div>

          {/* Donation Status */}
          <div className="border rounded-xl p-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Donation Status & Recovery</p>
            <div>
              <Label>Donation Status</Label>
              <Select value={form.donation_status || ''} onValueChange={v => set('donation_status', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_assessment">Pending Assessment</SelectItem>
                  <SelectItem value="approved_for_recovery">Approved for Recovery</SelectItem>
                  <SelectItem value="recovery_scheduled">Recovery Scheduled</SelectItem>
                  <SelectItem value="recovery_completed">Recovery Completed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="not_eligible">Not Eligible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Recovery Team Assigned</Label>
                <Input className="mt-1.5" value={form.recovery_team_assigned || ''} onChange={e => set('recovery_team_assigned', e.target.value)} />
              </div>
              <div>
                <Label>Recovery Facility</Label>
                <Input className="mt-1.5" value={form.recovery_facility || ''} onChange={e => set('recovery_facility', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Recovery Date & Time</Label>
              <Input type="datetime-local" className="mt-1.5" value={form.recovery_datetime || ''} onChange={e => set('recovery_datetime', e.target.value)} />
            </div>
            <div>
              <Label>Special Handling Instructions</Label>
              <Input className="mt-1.5" value={form.donation_special_handling || ''} onChange={e => set('donation_special_handling', e.target.value)} />
            </div>
            <div>
              <Label>Donation Notes</Label>
              <Textarea className="mt-1.5" rows={2} value={form.donation_notes || ''} onChange={e => set('donation_notes', e.target.value)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}