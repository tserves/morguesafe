import { getHospital } from '@/lib/hospitals';
import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';

/**
 * Color-coded hospital badge.
 * @param {string} hospitalId - 'oakville' | 'milton' | 'georgetown'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} showIcon - whether to show the building icon
 * @param {boolean} showCode - whether to show the hospital code instead of full short name
 */
export default function HospitalBadge({ hospitalId, size = 'sm', showIcon = true, showCode = false }) {
  const hospital = getHospital(hospitalId);

  if (!hospital) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
        {showIcon && <Building2 className="w-3 h-3" />}
        Unassigned
      </span>
    );
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        hospital.badge,
        sizeClasses[size] || sizeClasses.sm
      )}
    >
      {showIcon && <Building2 className={cn(size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3')} />}
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: hospital.color }}
      />
      {showCode ? hospital.code : hospital.short}
    </span>
  );
}