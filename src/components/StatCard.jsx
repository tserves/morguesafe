import { cn } from '@/lib/utils';

export default function StatCard({ label, value, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-600 ring-blue-100',
    green:  'bg-green-50 text-green-600 ring-green-100',
    amber:  'bg-amber-50 text-amber-600 ring-amber-100',
    red:    'bg-red-50 text-red-600 ring-red-100',
    purple: 'bg-purple-50 text-purple-600 ring-purple-100',
    cyan:   'bg-cyan-50 text-cyan-600 ring-cyan-100',
  };

  return (
    <div className="bg-card rounded-xl border p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center ring-1", colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}