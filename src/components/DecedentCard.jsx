import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { cn } from '@/lib/utils';

export default function DecedentCard({ decedent }) {
  const name = decedent.first_name
    ? `${decedent.first_name} ${decedent.last_name || ''}`.trim()
    : 'Unidentified Decedent';

  const hasFlags = decedent.flags && decedent.flags.length > 0;

  return (
    <Link
      to={`/decedent/${decedent.id}`}
      className={cn(
        "block bg-card rounded-xl border p-4 hover:shadow-md hover:border-primary/20 transition-all group",
        hasFlags && "border-l-4 border-l-amber-400"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {decedent.unique_id}
            </span>
            {hasFlags && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
          </div>
          <p className="font-semibold text-foreground truncate">{name}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={decedent.status} />
            <StatusBadge status={decedent.identification_status} />
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
      </div>

      <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-muted-foreground">
        {decedent.storage_location_label && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {decedent.storage_location_label}
          </span>
        )}
        {decedent.arrival_datetime && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(decedent.arrival_datetime), 'MMM d, HH:mm')}
          </span>
        )}
        <span className="capitalize">{decedent.source_type?.replace('_', ' ')}</span>
      </div>
    </Link>
  );
}