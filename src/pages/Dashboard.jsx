import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { 
  Users, AlertTriangle, Warehouse, FlaskConical,
  TrendingUp, Clock, CheckCircle, UserPlus,
  Shield, ArrowRight
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import DecedentCard from '@/components/DecedentCard';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function Dashboard() {
  const [decedents, setDecedents] = useState([]);
  const [custodyLogs, setCustodyLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Decedent.list('-arrival_datetime', 50),
      base44.entities.CustodyLog.list('-timestamp', 10),
    ]).then(([d, c]) => {
      setDecedents(d);
      setCustodyLogs(c);
      setLoading(false);
    });
  }, []);

  const stats = {
    total: decedents.length,
    inStorage: decedents.filter(d => d.status === 'storage').length,
    inExam: decedents.filter(d => d.status === 'examination').length,
    flagged: decedents.filter(d => d.flags && d.flags.length > 0).length,
    unidentified: decedents.filter(d => d.identification_status === 'unidentified').length,
    released: decedents.filter(d => d.status === 'released').length,
  };

  const recentDecedents = decedents.slice(0, 6);
  const alertDecedents = decedents.filter(d => d.flags && d.flags.length > 0).slice(0, 3);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Morgue Operations Dashboard"
        subtitle={`${format(new Date(), 'EEEE, MMMM d, yyyy')} · Active Cases`}
        actions={
          <Link to="/intake">
            <Button size="sm" className="gap-2">
              <UserPlus className="w-4 h-4" />
              New Intake
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Cases" value={loading ? '—' : stats.total} icon={Users} color="blue" />
        <StatCard label="In Storage" value={loading ? '—' : stats.inStorage} icon={Warehouse} color="cyan" />
        <StatCard label="Examination" value={loading ? '—' : stats.inExam} icon={FlaskConical} color="purple" />
        <StatCard label="Unidentified" value={loading ? '—' : stats.unidentified} icon={AlertTriangle} color="amber" />
        <StatCard label="Flagged" value={loading ? '—' : stats.flagged} icon={Shield} color="red" />
        <StatCard label="Released" value={loading ? '—' : stats.released} icon={CheckCircle} color="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Cases</h2>
            <Link to="/custody" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentDecedents.length === 0 ? (
            <div className="bg-card border rounded-xl p-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No cases recorded yet</p>
              <Link to="/intake">
                <Button size="sm" variant="outline" className="mt-3 gap-2">
                  <UserPlus className="w-3.5 h-3.5" /> Record First Intake
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDecedents.map(d => <DecedentCard key={d.id} decedent={d} />)}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Alerts */}
          <div>
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Active Alerts
            </h2>
            {alertDecedents.length === 0 ? (
              <div className="bg-card border rounded-xl p-4 text-center">
                <CheckCircle className="w-8 h-8 text-success mx-auto mb-1 opacity-60" />
                <p className="text-xs text-muted-foreground">No active alerts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alertDecedents.map(d => (
                  <div key={d.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-xs font-medium text-amber-800 font-mono">{d.unique_id}</span>
                    </div>
                    <p className="text-xs text-amber-700 mt-1">
                      {d.flags?.join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Custody Activity */}
          <div>
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Recent Activity
            </h2>
            <div className="space-y-1">
              {custodyLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No activity logged</p>
              ) : custodyLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground capitalize">
                      {log.action_type?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {log.decedent_unique_id} · {log.performed_by}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {log.timestamp ? format(new Date(log.timestamp), 'HH:mm') : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="font-semibold text-foreground mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'New Intake', path: '/intake', icon: UserPlus },
                { label: 'Scan Body', path: '/custody', icon: Shield },
                { label: 'Storage Map', path: '/storage', icon: Warehouse },
                { label: 'Audit Log', path: '/audit', icon: TrendingUp },
              ].map(({ label, path, icon: Icon }) => (
                <Link key={path} to={path}>
                  <div className="bg-card border rounded-lg p-3 hover:bg-muted/50 hover:border-primary/20 transition-all text-center cursor-pointer">
                    <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
                    <p className="text-xs font-medium text-foreground">{label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}