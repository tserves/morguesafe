import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeftRight, Loader2, Building2, AlertTriangle } from 'lucide-react';
import { HOSPITAL_LIST, getHospital } from '@/lib/hospitals';
import { format } from 'date-fns';

/**
 * Modal for transferring a case between hospital locations.
 * Creates a HospitalTransfer record, updates the Decedent's hospital_location,
 * and logs a custody event — maintaining one continuous chain of custody.
 */
export default function HospitalTransferModal({ decedent, onClose, onTransferred }) {
  const [toHospital, setToHospital] = useState('');
  const [transferredBy, setTransferredBy] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fromHospital = decedent?.hospital_location || 'oakville';
  const fromConfig = getHospital(fromHospital);

  const availableHospitals = HOSPITAL_LIST.filter(h => h.id !== fromHospital);

  const handleTransfer = async () => {
    if (!toHospital || !transferredBy || !reason) {
      setError('Destination hospital, transferring user, and reason are all required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const now = new Date().toISOString();
      const decedentName = decedent.first_name
        ? `${decedent.first_name} ${decedent.last_name || ''}`.trim()
        : 'Unidentified';

      // 1. Create HospitalTransfer record
      await base44.entities.HospitalTransfer.create({
        decedent_id: decedent.id,
        decedent_unique_id: decedent.unique_id,
        decedent_name: decedentName,
        from_hospital: fromHospital,
        to_hospital: toHospital,
        transfer_datetime: now,
        transferred_by: transferredBy,
        reason,
        status: 'in_transit',
        notes,
      });

      // 2. Update Decedent's current hospital location (keeps same case number)
      await base44.entities.Decedent.update(decedent.id, {
        hospital_location: toHospital,
      });

      // 3. Log custody event — continuous chain of custody across locations
      await base44.entities.CustodyLog.create({
        decedent_id: decedent.id,
        decedent_unique_id: decedent.unique_id,
        action_type: 'hospital_transfer',
        from_location: `${fromConfig?.short || fromHospital}`,
        to_location: `${getHospital(toHospital)?.short || toHospital}`,
        performed_by: transferredBy,
        performed_by_role: 'Transfer Officer',
        timestamp: now,
        notes: `Inter-hospital transfer: ${fromConfig?.short} → ${getHospital(toHospital)?.short}. Reason: ${reason}. ${notes || ''}`.trim(),
        verification_method: 'manual',
        hospital_location: toHospital,
      });

      onTransferred && onTransferred(toHospital);
      onClose();
    } catch (e) {
      setError(e?.message || 'Transfer failed. Please try again.');
    }

    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-primary" />
            Inter-Hospital Transfer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Case info */}
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{decedent?.unique_id}</span>
            <span className="text-sm font-medium">
              {decedent?.first_name ? `${decedent.first_name} ${decedent.last_name || ''}`.trim() : 'Unidentified'}
            </span>
          </div>

          {/* Transfer visual */}
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border-2 p-3 text-center" style={{ borderColor: fromConfig?.color + '40', background: fromConfig?.color + '08' }}>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">From</p>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: fromConfig?.color }} />
                <p className="text-sm font-semibold">{fromConfig?.short}</p>
              </div>
            </div>
            <ArrowLeftRight className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 rounded-lg border-2 border-dashed border-primary/30 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">To</p>
              <Select value={toHospital} onValueChange={setToHospital}>
                <SelectTrigger className="border-0 shadow-none h-auto p-0 text-sm font-semibold">
                  <SelectValue placeholder="Select hospital" />
                </SelectTrigger>
                <SelectContent>
                  {availableHospitals.map(h => (
                    <SelectItem key={h.id} value={h.id}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
                        {h.short}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              The case number ({decedent?.unique_id}) and all custody history will be preserved.
              The decedent's current hospital will be updated to the destination.
            </p>
          </div>

          <div>
            <Label>Transferring User <span className="text-destructive">*</span></Label>
            <Input className="mt-1.5" value={transferredBy} onChange={e => setTransferredBy(e.target.value)} placeholder="Your name" />
          </div>

          <div>
            <Label>Reason for Transfer <span className="text-destructive">*</span></Label>
            <Input className="mt-1.5" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Capacity, specialist examination, family request" />
          </div>

          <div>
            <Label>Additional Notes</Label>
            <Textarea className="mt-1.5" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleTransfer} disabled={saving || !toHospital || !transferredBy || !reason} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
            Execute Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}