import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Search, MapPin, Clock, AlertTriangle, Loader2, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function ChainOfCustody() {
  const [decedents, setDecedents] = useState([]);
  const [custodyLogs, setCustodyLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDecedent, setSelectedDecedent] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Decedent.list('-arrival_datetime', 100),
      base44.entities.CustodyLog.list('-timestamp', 200),
    ]).then(([d, c]) => {
      setDecedents(d);
      setCustodyLogs(c);
      setLoading(false);
    });
  }, []);

  const filtered = decedents.filter(d => {
    const name = `${d.first_name || ''} ${d.last_name || ''}`.toLowerCase();
    const matchSearch = !search ||
      name.includes(search.toLowerCase()) ||
      d.unique_id?.toLowerCase().includes(search.toLowerCase()) ||
      d.case_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getDecedentLogs = (decedentId) =>
    custodyLogs.filter(l => l.decedent_id === decedentId)
      .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

  const selectedLogs = selectedDecedent ? getDecedentLogs(selectedDecedent.id) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Chain of Custody"
        subtitle="Full traceability for every case"
        actions={
          <div className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full ring-1 ring-green-200">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Chain Intact
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, ID, or case number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {['intake','storage','examination','holding','released','transferred'].map(s => (
              <SelectItem key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">No cases found</div>
          ) : filtered.map(d => {
            const name = d.first_name ? `${d.first_name} ${d.last_name || ''}`.trim() : 'Unidentified';
            const logs = getDecedentLogs(d.id);
            const lastLog = logs[0];
            const isSelected = selectedDecedent?.id === d.id;

            return (
              <div
                key={d.id}
                onClick={() => setSelectedDecedent(isSelected ? null : d)}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'bg-card hover:border-primary/30 hover:shadow-sm'
                } ${d.flags?.length ? 'border-l-4 border-l-amber-400' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{d.unique_id}</span>
                      {d.flags?.length > 0 && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                    </div>
                    <p className="text-sm font-semibold truncate">{name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                </div>
                {lastLog && (
                  <div className="mt-2.5 pt-2.5 border-t flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="capitalize">{lastLog.action_type?.replace(/_/g,' ')}</span>
                    <span>· {lastLog.timestamp ? format(new Date(lastLog.timestamp), 'MMM d, HH:mm') : ''}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Custody Timeline */}
        <div className="lg:col-span-3">
          {!selectedDecedent ? (
            <div className="bg-card border rounded-xl p-8 text-center h-full flex flex-col items-center justify-center">
              <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Select a case to view the chain of custody</p>
            </div>
          ) : (
            <div className="bg-card border rounded-xl p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <span className="font-mono text-xs text-muted-foreground">{selectedDecedent.unique_id}</span>
                  <h3 className="font-semibold text-foreground mt-0.5">
                    {selectedDecedent.first_name
                      ? `${selectedDecedent.first_name} ${selectedDecedent.last_name || ''}`
                      : 'Unidentified Decedent'}
                  </h3>
                </div>
                <Link to={`/decedent/${selectedDecedent.id}`}>
                  <Button size="sm" variant="outline">View Case</Button>
                </Link>
              </div>

              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-4">
                Custody Timeline · {selectedLogs.length} Events
              </p>

              <div className="space-y-0">
                {selectedLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No custody events logged</p>
                ) : selectedLogs.map((log, i) => (
                  <div key={log.id || i} className="relative pl-6 pb-5 last:pb-0">
                    {i < selectedLogs.length - 1 && (
                      <div className="absolute left-2 top-4 bottom-0 w-px bg-border" />
                    )}
                    <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full ring-2 ring-background flex items-center justify-center ${
                      log.is_flagged ? 'bg-destructive' : 'bg-primary'
                    }`}>
                      {log.is_flagged && <AlertTriangle className="w-2 h-2 text-white" />}
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {log.action_type?.replace(/_/g, ' ')}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          {log.to_location && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{log.to_location}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            by <span className="font-medium text-foreground">{log.performed_by}</span>
                            {log.performed_by_role && ` (${log.performed_by_role})`}
                          </span>
                        </div>
                        {log.verification_method && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded mt-1.5 inline-block">
                            {log.verification_method?.replace('_', ' ')}
                          </span>
                        )}
                        {log.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{log.notes}</p>
                        )}
                        {log.is_flagged && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                            <AlertTriangle className="w-3 h-3" />{log.flag_reason}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {log.timestamp ? format(new Date(log.timestamp), 'MMM d\nHH:mm') : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}