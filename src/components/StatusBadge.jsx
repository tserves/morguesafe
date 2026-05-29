import { cn } from '@/lib/utils';


const statusConfig = {
  // Decedent status
  intake:        { label: 'Intake',        className: 'bg-blue-100 text-blue-700 border-blue-200/80', dot: 'bg-blue-500' },
  storage:       { label: 'Storage',       className: 'bg-sky-100 text-sky-700 border-sky-200/80', dot: 'bg-sky-500' },
  examination:   { label: 'Examination',   className: 'bg-violet-100 text-violet-700 border-violet-200/80', dot: 'bg-violet-500' },
  holding:       { label: 'Holding',       className: 'bg-amber-100 text-amber-700 border-amber-200/80', dot: 'bg-amber-500' },
  released:      { label: 'Released',      className: 'bg-emerald-100 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
  transferred:   { label: 'Transferred',   className: 'bg-slate-100 text-slate-600 border-slate-200/80', dot: 'bg-slate-400' },
  // Identification
  identified:           { label: 'Identified',         className: 'bg-emerald-100 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
  unidentified:         { label: 'Unidentified',        className: 'bg-rose-100 text-rose-700 border-rose-200/80', dot: 'bg-rose-500' },
  pending_verification: { label: 'Pending Verification', className: 'bg-amber-100 text-amber-700 border-amber-200/80', dot: 'bg-amber-500' },
  // Exam
  scheduled:     { label: 'Scheduled',     className: 'bg-blue-100 text-blue-700 border-blue-200/80', dot: 'bg-blue-500' },
  in_progress:   { label: 'In Progress',   className: 'bg-violet-100 text-violet-700 border-violet-200/80', dot: 'bg-violet-500' },
  completed:     { label: 'Completed',     className: 'bg-emerald-100 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
  cancelled:     { label: 'Cancelled',     className: 'bg-slate-100 text-slate-600 border-slate-200/80', dot: 'bg-slate-400' },
  pending_review: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700 border-amber-200/80', dot: 'bg-amber-500' },
  // Release
  pending:                  { label: 'Pending',              className: 'bg-slate-100 text-slate-600 border-slate-200/80', dot: 'bg-slate-400' },
  verification_in_progress: { label: 'Verifying',            className: 'bg-amber-100 text-amber-700 border-amber-200/80', dot: 'bg-amber-500' },
  approved:      { label: 'Approved',      className: 'bg-emerald-100 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
  rejected:      { label: 'Rejected',      className: 'bg-rose-100 text-rose-700 border-rose-200/80', dot: 'bg-rose-500' },
  // Storage
  available:     { label: 'Available',     className: 'bg-emerald-100 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
  occupied:      { label: 'Occupied',      className: 'bg-rose-100 text-rose-700 border-rose-200/80', dot: 'bg-rose-500' },
  maintenance:   { label: 'Maintenance',   className: 'bg-amber-100 text-amber-700 border-amber-200/80', dot: 'bg-amber-500' },
  reserved:      { label: 'Reserved',      className: 'bg-indigo-100 text-indigo-700 border-indigo-200/80', dot: 'bg-indigo-500' },
};

export default function StatusBadge({ status, size = 'sm', showDot = true }) {
  const config = statusConfig[status] || { label: status || '—', className: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium border whitespace-nowrap',
      size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
      config.className
    )}>
      {showDot && <span className={cn('rounded-full shrink-0', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', config.dot)} />}
      {config.label}
    </span>
  );
}