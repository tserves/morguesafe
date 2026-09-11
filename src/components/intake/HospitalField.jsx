import { HOSPITAL_LIST } from '@/lib/hospitals';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';

/**
 * Compact hospital location selector for intake forms.
 * Required field — every new case must be assigned to a hospital.
 */
export default function HospitalField({ value, onChange }) {
  return (
    <div>
      <Label className="flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5" /> Hospital Location <span className="text-destructive">*</span>
      </Label>
      <div className="grid grid-cols-3 gap-2 mt-1.5">
        {HOSPITAL_LIST.map(h => (
          <button
            key={h.id}
            type="button"
            onClick={() => onChange(h.id)}
            className={cn(
              'flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all text-center',
              value === h.id
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-primary/40 bg-card'
            )}
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: h.color }} />
            <span className="text-[11px] font-medium leading-tight">{h.short}</span>
            <span className="text-[9px] text-muted-foreground">{h.code}</span>
          </button>
        ))}
      </div>
    </div>
  );
}