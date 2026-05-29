import { cn } from '@/lib/utils';

export default function PageHeader({ title, subtitle, actions, badge, className }) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7", className)}>
      <div className="flex items-start gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {badge && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5 font-medium">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 shrink-0">{actions}</div>
      )}
    </div>
  );
}