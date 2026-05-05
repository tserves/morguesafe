import { cn } from '@/lib/utils';

const statusConfig = {
  // Decedent status
  intake: { label: 'Intake', className: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' },
  storage: { label: 'Storage', className: 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200' },
  examination: { label: 'Examination', className: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200' },
  holding: { label: 'Holding', className: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' },
  released: { label: 'Released', className: 'bg-green-100 text-green-700 ring-1 ring-green-200' },
  transferred: { label: 'Transferred', className: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
  // Identification
  identified: { label: 'Identified', className: 'bg-green-100 text-green-700 ring-1 ring-green-200' },
  unidentified: { label: 'Unidentified', className: 'bg-red-100 text-red-700 ring-1 ring-red-200' },
  pending_verification: { label: 'Pending Verification', className: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' },
  // Exam
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' },
  in_progress: { label: 'In Progress', className: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700 ring-1 ring-green-200' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
  pending_review: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' },
  // Release
  pending: { label: 'Pending', className: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
  verification_in_progress: { label: 'Verification', className: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700 ring-1 ring-green-200' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 ring-1 ring-red-200' },
  // Storage
  available: { label: 'Available', className: 'bg-green-100 text-green-700 ring-1 ring-green-200' },
  occupied: { label: 'Occupied', className: 'bg-red-100 text-red-700 ring-1 ring-red-200' },
  maintenance: { label: 'Maintenance', className: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' },
  reserved: { label: 'Reserved', className: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      config.className
    )}>
      {config.label}
    </span>
  );
}