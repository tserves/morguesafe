import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import DecedentCard from '@/components/DecedentCard';
import { Button } from '@/components/ui/button';
import { format, isToday, formatDistanceToNow } from 'date-fns';
import { 
  Users, AlertTriangle, Warehouse, FlaskConical,
  Clock, CheckCircle, UserPlus, Shield, ArrowRight,
  QrCode, TrendingUp, Activity, Fingerprint, LogOut,
  CalendarDays, ClipboardList, ChevronRight
} from 'lucide-react';

const actionTypeColors = {
  intake: 'bg-blue-500',
  scan_in: 'bg-green-500',
  scan_out: 'bg-amber-500',
  moved_to_storage: 'bg-cyan-500',
  moved_to_examination: 'bg-purple-500',
  released: 'bg-green-600',
  transferred: 'bg-slate-400',
  examined: 'bg-purple-400',
  alert_raised: 'bg-red-500',
  note_added: 'bg-muted-foreground',
};

function StatTile({ label, value, icon: Icon, color, sub, to }) {
  const configs = {
    blue:   { tile: 'bg-blue-950/40 border-blue-800/40',   icon: 'bg-blue-500/20 text-blue-400',   val: 'text-blue-100' },
    cyan:   { tile: 'bg-cyan-950/40 border-cyan-800/40',   icon: 'bg-cyan-500/20 text-cyan-400',   val: 'text-cyan-100' },
    purple: { tile: 'bg-purple-950/40 border-purple-800/40', icon: 'bg-purple-500/20 text-purple-400', val: 'text-purple-100' },
    amber:  { tile: 'bg-amber-950/40 border-amber-800/40', icon: 'bg-amber-500/20 text-amber-400', val: 'text-amber-100' },
    red:    { tile: 'bg-red-950/40 border-red-800/40',     icon: 'bg-red-500/20 text-red-400',     val: 'text-red-100' },
    green:  { tile: 'bg-green-950/40 border-green-800/40', icon: 'bg-green-500/20 text-green-400', val: 'text-green-100' },
  };
  const c = configs[color] || configs.blue;
  const inner = (
    <div className={`relative rounded-2xl border p-5 flex flex-col gap-3 transition-all hover:scale-[1.02] cursor-pointer ${c.tile}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className={`text-3xl font-bold leading-none ${c.val}`}>{value ?? '—'}</p>
        <p className="text-xs text-slate-400 mt-1.5 font-medium uppercase tracking-wider">{label}</p>
        {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const [decedents, setDecedents] = useState([]);
  const [custodyLogs, setCustodyLogs] = useState([]);
  const [examinations, setExaminations] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Decedent.list('-arrival_datetime', 100),
      base44.entities.CustodyLog.list('-timestamp', 12),
      base44.entities.Examination.list('-scheduled_datetime', 50),
      base44.entities.Release.list('-created_date', 50),
    ]).then(([d, c, e, r]) => {
      setDecedents(d);
      setCustodyLogs(c);
      setExaminations(e);
      setReleases(r);
      setLoading(false);
    });
  }, []);

  const stats = {
    total:        decedents.length,
    inStorage:    decedents.filter(d => d.status === 'storage').length,
    inExam:       decedents.filter(d => d.status === 'examination').length,
    flagged:      decedents.filter(d => d.flags?.length > 0).length,
    unidentified: decedents.filter(d => d.identification_status === 'unidentified').length,
    released:     decedents.filter(d => d.status === 'released').length,
  };

  const todayIntakes  = decedents.filter(d => d.arrival_datetime && isToday(new Date(d.arrival_datetime)));
  const recentDecedents = decedents.slice(0, 5);
  const alertDecedents  = decedents.filter(d => d.flags?.length > 0).slice(0, 4);
  const pendingReleases = releases.filter(r => r.status !== 'completed' && r.status !== 'rejected');
  const upcomingExams   = examinations.filter(e => e.status === 'scheduled' || e.status === 'in_progress').slice(0, 3);

  const quickActions = [
    { label: 'New Intake',    path: '/intake',      icon: UserPlus,     color: 'text-green-400',  bg: 'bg-green-500/10  hover:bg-green-500/20  border-green-800/30' },
    { label: 'Scan / Lookup', path: '/scan',        icon: QrCode,       color: 'text-blue-400',   bg: 'bg-blue-500/10   hover:bg-blue-500/20   border-blue-800/30' },
    { label: 'Daily Overview',path: '/daily',       icon: CalendarDays, color: 'text-indigo-400', bg: 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-800/30' },
    { label: 'Intake List',   path: '/intake-list', icon: ClipboardList,color: 'text-teal-400',   bg: 'bg-teal-500/10   hover:bg-teal-500/20   border-teal-800/30' },
    { label: 'Storage Map',   path: '/storage',     icon: Warehouse,    color: 'text-cyan-400',   bg: 'bg-cyan-500/10   hover:bg-cyan-500/20   border-cyan-800/30' },
    { label: 'Audit Log',     path: '/audit',       icon: TrendingUp,   color: 'text-slate-400',  bg: 'bg-slate-500/10  hover:bg-slate-500/20  border-slate-700/30' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header banner */}
      <div className="bg-primary border-b border-primary/80 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Activity className="w-4 h-4 text-primary-foreground/60" />
              <p className="text-xs text-primary-foreground/60 font-mono uppercase tracking-widest">Operations Center</p>
            </div>
            <h1 className="text-xl font-bold text-primary-foreground">MorgueSafe Dashboard</h1>
            <p className="text-sm text-primary-foreground/60 mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy · HH:mm")}</p>
          </div>
          <div className="flex items-center gap-2">
            {!loading && todayIntakes.length > 0 && (
              <div className="flex items-center gap-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-primary-foreground font-medium">{todayIntakes.length} intake{todayIntakes.length > 1 ? 's' : ''} today</span>
              </div>
            )}
            <Link to="/intake">
              <Button size="sm" variant="secondary" className="gap-2">
                <UserPlus className="w-4 h-4" /> New Intake
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatTile label="Total Cases"   value={loading ? '—' : stats.total}        icon={Users}        color="blue"   to="/intake-list" />
          <StatTile label="In Storage"    value={loading ? '—' : stats.inStorage}    icon={Warehouse}    color="cyan"   to="/storage" />
          <StatTile label="Examination"   value={loading ? '—' : stats.inExam}       icon={FlaskConical} color="purple" to="/examinations" />
          <StatTile label="Unidentified"  value={loading ? '—' : stats.unidentified} icon={Fingerprint}  color="amber" />
          <StatTile label="Flagged"       value={loading ? '—' : stats.flagged}      icon={Shield}       color="red" />
          <StatTile label="Released"      value={loading ? '—' : stats.released}     icon={CheckCircle}  color="green" />
        </div>

        {/* Main content grid */}
        <div className="grid xl:grid-cols-3 gap-5">

          {/* Recent Cases — 2 cols */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" /> Recent Cases
              </h2>
              <Link to="/intake-list" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
              </div>
            ) : recentDecedents.length === 0 ? (
              <div className="bg-card border rounded-2xl p-10 text-center">
                <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No cases recorded yet</p>
                <Link to="/intake">
                  <Button size="sm" variant="outline" className="mt-4 gap-2">
                    <UserPlus className="w-3.5 h-3.5" /> Record First Intake
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentDecedents.map(d => <DecedentCard key={d.id} decedent={d} />)}
              </div>
            )}

            {/* Pending releases + upcoming exams row */}
            <div className="grid sm:grid-cols-2 gap-4 mt-2">
              {/* Pending Releases */}
              <div className="bg-card border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                    <LogOut className="w-3.5 h-3.5 text-amber-500" /> Pending Releases
                  </h3>
                  <span className="text-xs font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-100">
                    {loading ? '—' : pendingReleases.length}
                  </span>
                </div>
                {!loading && pendingReleases.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">All clear</p>
                ) : (
                  <div className="space-y-2">
                    {pendingReleases.slice(0, 3).map(r => (
                      <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/50 border border-amber-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{r.decedent_name || r.decedent_unique_id}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{r.release_type?.replace('_',' ')} · {r.receiving_party_name}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                    ))}
                  </div>
                )}
                <Link to="/release" className="text-xs text-primary hover:underline flex items-center gap-0.5 mt-3">
                  Manage releases <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Upcoming Exams */}
              <div className="bg-card border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                    <FlaskConical className="w-3.5 h-3.5 text-purple-500" /> Upcoming Exams
                  </h3>
                  <span className="text-xs font-mono bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full border border-purple-100">
                    {loading ? '—' : upcomingExams.length}
                  </span>
                </div>
                {!loading && upcomingExams.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">None scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingExams.map(e => (
                      <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg bg-purple-50/50 border border-purple-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate capitalize">{e.exam_type?.replace(/_/g,' ')}</p>
                          <p className="text-[10px] text-muted-foreground">{e.decedent_name || e.decedent_unique_id}</p>
                        </div>
                        <StatusBadge status={e.status} />
                      </div>
                    ))}
                  </div>
                )}
                <Link to="/examinations" className="text-xs text-primary hover:underline flex items-center gap-0.5 mt-3">
                  View examinations <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">

            {/* Quick Actions */}
            <div>
              <h2 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide text-muted-foreground">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map(({ label, path, icon: Icon, color, bg }) => (
                  <Link key={path} to={path}>
                    <div className={`border rounded-xl p-3 transition-all cursor-pointer text-center ${bg}`}>
                      <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color}`} />
                      <p className="text-xs font-medium text-foreground leading-tight">{label}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Active Alerts */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Active Alerts
                </h2>
                {alertDecedents.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse-ring">
                    {alertDecedents.length}
                  </span>
                )}
              </div>
              {alertDecedents.length === 0 ? (
                <div className="bg-card border rounded-xl p-4 text-center">
                  <CheckCircle className="w-7 h-7 text-green-500/50 mx-auto mb-1.5" />
                  <p className="text-xs text-muted-foreground">No active alerts</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alertDecedents.map(d => (
                    <Link key={d.id} to={`/decedent/${d.id}`}>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 hover:border-amber-300 transition-colors">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="text-xs font-mono font-medium text-amber-800">{d.unique_id}</span>
                          <ChevronRight className="w-3 h-3 text-amber-400 ml-auto" />
                        </div>
                        <p className="text-[11px] text-amber-700 mt-1 line-clamp-1">
                          {d.flags?.join(' · ')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Feed */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                  <Activity className="w-3.5 h-3.5 text-muted-foreground" /> Live Activity
                </h2>
                <Link to="/audit" className="text-xs text-primary hover:underline">View all</Link>
              </div>
              <div className="bg-card border rounded-xl overflow-hidden">
                {custodyLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No activity logged</p>
                ) : (
                  <div className="divide-y">
                    {custodyLogs.map(log => (
                      <div key={log.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${actionTypeColors[log.action_type] || 'bg-muted-foreground'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground capitalize leading-snug">
                            {log.action_type?.replace(/_/g, ' ')}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {log.decedent_unique_id} · {log.performed_by}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-muted-foreground">
                            {log.timestamp ? (isToday(new Date(log.timestamp))
                              ? format(new Date(log.timestamp), 'HH:mm')
                              : formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }))
                              : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}