import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileText, Search, Download, Filter, Shield, AlertTriangle, Clock, MapPin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const ACTION_COLORS = {
  intake: 'bg-blue-100 text-blue-700',
  released: 'bg-green-100 text-green-700',
  examined: 'bg-purple-100 text-purple-700',
  moved_to_storage: 'bg-cyan-100 text-cyan-700',
  moved_to_examination: 'bg-purple-100 text-purple-700',
  moved_to_holding: 'bg-amber-100 text-amber-700',
  personal_effects_logged: 'bg-orange-100 text-orange-700',
  alert_raised: 'bg-red-100 text-red-700',
  default: 'bg-muted text-muted-foreground',
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    base44.entities.CustodyLog.list('-timestamp', 500).then(l => {
      setLogs(l);
      setLoading(false);
    });
  }, []);

  const filtered = logs.filter(log => {
    const matchSearch = !search ||
      log.decedent_unique_id?.toLowerCase().includes(search.toLowerCase()) ||
      log.performed_by?.toLowerCase().includes(search.toLowerCase()) ||
      log.action_type?.toLowerCase().includes(search.toLowerCase()) ||
      log.notes?.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || log.action_type === actionFilter;
    const matchDate = !dateFilter || (log.timestamp && log.timestamp.startsWith(dateFilter));
    return matchSearch && matchAction && matchDate;
  });

  const uniqueActions = [...new Set(logs.map(l => l.action_type).filter(Boolean))];

  const stats = {
    total: logs.length,
    flagged: logs.filter(l => l.is_flagged).length,
    today: logs.filter(l => l.timestamp && l.timestamp.startsWith(new Date().toISOString().slice(0,10))).length,
    users: new Set(logs.map(l => l.performed_by).filter(Boolean)).size,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Audit Log"
        subtitle="Immutable chain of custody records"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs bg-primary/5 text-primary px-3 py-1.5 rounded-full ring-1 ring-primary/20">
              <Shield className="w-3.5 h-3.5" /> Tamper-Evident
            </div>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
          </div>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Events', value: stats.total, icon: FileText, color: 'text-blue-600' },
          { label: 'Today', value: stats.today, icon: Clock, color: 'text-green-600' },
          { label: 'Flagged Events', value: stats.flagged, icon: AlertTriangle, color: 'text-red-600' },
          { label: 'Unique Users', value: stats.users, icon: Shield, color: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className="text-2xl font-bold">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map(a => (
              <SelectItem key={a} value={a}>{a.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          className="w-40"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
        />
      </div>

      {/* Log Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Case ID</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Performed By</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Location</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No events found
                </td></tr>
              ) : filtered.map((log, i) => {
                const actionColor = ACTION_COLORS[log.action_type] || ACTION_COLORS.default;
                return (
                  <tr
                    key={log.id || i}
                    className={`border-b last:border-0 transition-colors ${log.is_flagged ? 'bg-red-50' : 'hover:bg-muted/30'}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono text-xs text-foreground">
                        {log.timestamp ? format(new Date(log.timestamp), 'yyyy-MM-dd') : '—'}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {log.timestamp ? format(new Date(log.timestamp), 'HH:mm:ss') : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                        {log.decedent_unique_id || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {log.is_flagged && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${actionColor}`}>
                          {log.action_type?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium">{log.performed_by || '—'}</div>
                      {log.performed_by_role && (
                        <div className="text-xs text-muted-foreground">{log.performed_by_role}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {log.to_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{log.to_location}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-48 truncate">
                      {log.notes || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t bg-muted/30 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{filtered.length} events shown</p>
            <p className="text-xs text-muted-foreground font-mono">Read-only · Append-only</p>
          </div>
        )}
      </div>
    </div>
  );
}