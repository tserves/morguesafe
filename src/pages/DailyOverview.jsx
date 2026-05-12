import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { format, isToday, isTomorrow, startOfDay, endOfDay, addDays } from 'date-fns';
import { 
  UserPlus, LogOut, FlaskConical, Clock, AlertTriangle,
  CheckCircle, ArrowRight, Loader2, CalendarDays, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function SectionHeader({ icon: Icon, title, count, color }) {
  return (
    <div className={`flex items-center gap-2 mb-3 pb-2 border-b`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="font-semibold text-foreground">{title}</h2>
      <span className="ml-auto text-xs font-mono bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{count}</span>
    </div>
  );
}

export default function DailyOverview() {
  const [decedents, setDecedents] = useState([]);
  const [examinations, setExaminations] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    setLoading(true);
    const [d, e, r] = await Promise.all([
      base44.entities.Decedent.list('-arrival_datetime', 200),
      base44.entities.Examination.list('-scheduled_datetime', 100),
      base44.entities.Release.list('-created_date', 100),
    ]);
    setDecedents(d);
    setExaminations(e);
    setReleases(r);
    setLoading(false);
    setLastRefresh(new Date());
  };

  useEffect(() => { load(); }, []);

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const tomorrowEnd = endOfDay(addDays(today, 1));

  // Today's intakes
  const todayIntakes = decedents.filter(d => {
    if (!d.arrival_datetime) return false;
    const arr = new Date(d.arrival_datetime);
    return arr >= todayStart && arr <= todayEnd;
  });

  // Pending releases (not yet completed)
  const pendingReleases = releases.filter(r => r.status !== 'completed' && r.status !== 'rejected');

  // Upcoming exams — today + tomorrow, not completed/cancelled
  const upcomingExams = examinations.filter(e => {
    if (!e.scheduled_datetime) return e.status === 'scheduled' || e.status === 'in_progress';
    const dt = new Date(e.scheduled_datetime);
    return dt <= tomorrowEnd && (e.status === 'scheduled' || e.status === 'in_progress');
  });

  // Flagged cases
  const flaggedCases = decedents.filter(d => d.flags && d.flags.length > 0);

  // Active cases (not released/transferred)
  const activeCases = decedents.filter(d => d.status !== 'released' && d.status !== 'transferred');

  const sections = [
    { key: 'intakes', icon: UserPlus, title: "Today's Intakes", count: todayIntakes.length, color: 'bg-blue-100 text-blue-600' },
    { key: 'releases', icon: LogOut, title: 'Pending Releases', count: pendingReleases.length, color: 'bg-amber-100 text-amber-600' },
    { key: 'exams', icon: FlaskConical, title: 'Upcoming Examinations', count: upcomingExams.length, color: 'bg-purple-100 text-purple-600' },
    { key: 'flags', icon: AlertTriangle, title: 'Flagged Cases', count: flaggedCases.length, color: 'bg-red-100 text-red-600' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Daily Overview"
        subtitle={format(today, "EEEE, MMMM d, yyyy")}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Updated {format(lastRefresh, 'HH:mm')}
            </span>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={load} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        }
      />

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {sections.map(s => (
          <div key={s.key} className="bg-card border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{loading ? '—' : s.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.title}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Today's Intakes */}
          <div className="bg-card border rounded-xl p-5">
            <SectionHeader icon={UserPlus} title="Today's Intakes" count={todayIntakes.length} color="bg-blue-100 text-blue-600" />
            {todayIntakes.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No intakes today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayIntakes.map(d => {
                  const name = d.first_name ? `${d.first_name} ${d.last_name || ''}`.trim() : 'Unidentified';
                  return (
                    <Link key={d.id} to={`/decedent/${d.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{d.unique_id}</span>
                          <StatusBadge status={d.identification_status} />
                        </div>
                        <p className="text-sm font-medium mt-0.5">{name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{d.source_type?.replace('_',' ')} · {d.intake_officer || '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{format(new Date(d.arrival_datetime), 'HH:mm')}</p>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground mt-1 ml-auto" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            <div className="mt-3 pt-3 border-t">
              <Link to="/intake-list" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all intakes <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Pending Releases */}
          <div className="bg-card border rounded-xl p-5">
            <SectionHeader icon={LogOut} title="Pending Releases" count={pendingReleases.length} color="bg-amber-100 text-amber-600" />
            {pendingReleases.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pending releases</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingReleases.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{r.decedent_unique_id}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-sm font-medium mt-0.5">{r.decedent_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        → {r.receiving_party_name} · {r.release_type?.replace('_',' ')}
                      </p>
                    </div>
                    <Link to="/release">
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        Process <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Examinations */}
          <div className="bg-card border rounded-xl p-5">
            <SectionHeader icon={FlaskConical} title="Upcoming Examinations" count={upcomingExams.length} color="bg-purple-100 text-purple-600" />
            {upcomingExams.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming examinations</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingExams.map(e => {
                  const when = e.scheduled_datetime ? new Date(e.scheduled_datetime) : null;
                  const label = when
                    ? isToday(when) ? `Today ${format(when, 'HH:mm')}`
                    : isTomorrow(when) ? `Tomorrow ${format(when, 'HH:mm')}`
                    : format(when, 'MMM d, HH:mm')
                    : 'Unscheduled';
                  return (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{e.decedent_unique_id}</span>
                          <StatusBadge status={e.status} />
                        </div>
                        <p className="text-sm font-medium mt-0.5 capitalize">{e.exam_type?.replace(/_/g,' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.decedent_name || 'Unknown'} · Dr. {e.pathologist_name || '—'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-medium ${isToday(when || new Date()) ? 'text-purple-600' : 'text-muted-foreground'}`}>
                          {label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-3 pt-3 border-t">
              <Link to="/examinations" className="text-xs text-primary hover:underline flex items-center gap-1">
                Manage examinations <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Flagged Cases */}
          <div className="bg-card border rounded-xl p-5">
            <SectionHeader icon={AlertTriangle} title="Flagged Cases" count={flaggedCases.length} color="bg-red-100 text-red-600" />
            {flaggedCases.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle className="w-8 h-8 text-green-500/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No flagged cases — all clear</p>
              </div>
            ) : (
              <div className="space-y-2">
                {flaggedCases.map(d => {
                  const name = d.first_name ? `${d.first_name} ${d.last_name || ''}`.trim() : 'Unidentified';
                  return (
                    <Link key={d.id} to={`/decedent/${d.id}`} className="flex items-start gap-3 p-3 rounded-lg bg-red-50/50 border border-red-100 hover:border-red-200 transition-colors">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{d.unique_id}</span>
                          <StatusBadge status={d.status} />
                        </div>
                        <p className="text-sm font-medium mt-0.5">{name}</p>
                        <p className="text-xs text-red-600 mt-0.5">{d.flags?.join(' · ')}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}