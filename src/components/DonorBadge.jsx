import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DonorBadge({ decedent, size = 'sm' }) {
  if (!decedent || decedent.is_donor !== 'yes') return null;

  const status = decedent.donation_status;
  const statusLabel = {
    pending_assessment: 'Pending Assessment',
    approved_for_recovery: 'Approved',
    recovery_scheduled: 'Recovery Scheduled',
    recovery_completed: 'Completed',
    declined: 'Declined',
    not_eligible: 'Not Eligible',
  }[status] || 'Donor Case';

  const isActive = !['declined', 'not_eligible', 'recovery_completed'].includes(status);

  if (size === 'lg') {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border-2 font-semibold',
        isActive
          ? 'bg-red-50 border-red-400 text-red-700'
          : 'bg-slate-50 border-slate-300 text-slate-600'
      )}>
        <Heart className={cn('w-4 h-4', isActive ? 'text-red-500 fill-red-400' : 'text-slate-400')} />
        <div>
          <p className="text-xs font-bold uppercase tracking-wide">Donor Case</p>
          <p className="text-[10px] font-normal">{statusLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
      isActive
        ? 'bg-red-50 border-red-300 text-red-700'
        : 'bg-slate-100 border-slate-300 text-slate-600'
    )}>
      <Heart className={cn('w-2.5 h-2.5', isActive ? 'fill-red-400 text-red-400' : 'text-slate-400')} />
      DONOR
    </span>
  );
}