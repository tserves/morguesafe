import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { format, isToday, formatDistanceToNow } from 'date-fns';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area
} from 'recharts';
import {
  Users, AlertTriangle, Warehouse, FlaskConical,
  Clock, CheckCircle, UserPlus, Shield, ArrowRight,
  QrCode, TrendingUp, Activity, Fingerprint, LogOut,
  CalendarDays, ClipboardList, ChevronRight, ArrowUpRight
} from 'lucide-react';

/* ── helpers ───────────────────────────────────────────── */
const KPI_COLORS = {
  total:        { bg: 'bg-blue-50',   border: 'border-blue-200',   accent: '#2563eb', label: 'text-blue-600' },
  storage:      { bg: 'bg-cyan-50',   border: 'border-cyan-200',   accent: '#0891b2', label: 'text-cyan-700' },
  exam:         { bg: 'bg-purple-50', border: 'border-purple-200', accent: '#9333ea', label: 'text-purple-700' },
  unidentified: { bg: 'bg-amber-50',  border: 'border-amber-200',  accent: '#d97706', label: 'text-amber-700' },
  flagged:      { bg: 'bg-red-50',    border: 'border-red-200',    accent: '#dc2626', label: 'text-red-700' },
  released:     { bg: 'bg-green-50',  border: 'border-green-200',  accent: '#16a34a', label: 'text-green-700' },
};

function KpiCard({ label, value, icon: Icon, colorKey, to, delta }) {
  const c = KPI_COLORS[colorKey];
  const inner = (
    <div className={`relative rounded-2xl border ${c.bg} ${c.border} p-5 flex flex-col gap-4 group hover:shadow-md transition-all cursor-pointer`}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: c.accent + '18', border: `1px solid ${c.accent}33` }}>
          <Icon className="w-5 h-5" style={{ color: c.accent }} />
        </div>
        {delta !== undefined && (
          <span className={`text-[11px] font-medium flex items-center gap-0.5 ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            <ArrowUpRight className="w-3 h-3" />{delta > 0 ? '+' : ''}{delta} today
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-800 leading-none">{value ?? '—'}</p>
        <p className={`text-xs font-semibold mt-1.5 uppercase tracking-wider ${c.label}`}>{label}</p>
      </div>
      <div className="absolute bottom-0 left-0 h-0.5 w-full rounded-b-2xl" style={{ background: `linear-gradient(to right, ${c.accent}66, transparent)` }} />
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

const STATUS_COLORS = ['#3b82f6','#06b6d4','#a855f7','#f59e0b','#ef4444','#22c55e'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildMonthlyData(decedents) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const label = MONTHS[d.getMonth()];
    const intakes = decedents.filter(dec => {
      if (!dec.arrival_datetime) return false;
      const a = new Date(dec.arrival_datetime);
      return a >= d && a <= end;
    }).length;
    const released = decedents.filter(dec => {
      if (!dec.arrival_datetime || dec.status !== 'released') return false;
      const a = new Date(dec.arrival_datetime);
      return a >= d && a <= end;
    }).length;
    return { month: label, Intakes: intakes, Released: released };
  });
}

const actionTypeColors = {
  intake: '#3b82f6', scan_in: '#22c55e', scan_out: '#f59e0b',
  moved_to_storage: '#06b6d4', moved_to_examination: '#a855f7',
  released: '#22c55e', transferred: '#94a3b8', alert_raised: '#ef4444',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 shadow-lg">
      <p className="font-semibold mb-1 text-slate-500">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

/* ── main ───────────────────────────────────────────────── */
export default function Dashboard() {
  const [decedents, setDecedents] = useState([]);
  const [custodyLogs, setCustodyLogs] = useState([]);
  const [examinations, setExaminations] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Decedent.list('-arrival_datetime', 200),
      base44.entities.CustodyLog.list('-timestamp', 15),
      base44.entities.Examination.list('-scheduled_datetime', 100),
      base44.entities.Release.list('-created_date', 100),
    ]).then(([d, c, e, r]) => {
      setDecedents(d); setCustodyLogs(c); setExaminations(e); setReleases(r);
      setLoading(false);
    });
  }, []);

  const todayIntakes = decedents.filter(d => d.arrival_datetime && isToday(new Date(d.arrival_datetime)));

  const stats = {
    total:        decedents.length,
    inStorage:    decedents.filter(d => d.status === 'storage').length,
    inExam:       decedents.filter(d => d.status === 'examination').length,
    unidentified: decedents.filter(d => d.identification_status === 'unidentified').length,
    flagged:      decedents.filter(d => d.flags?.length > 0).length,
    released:     decedents.filter(d => d.status === 'released').length,
  };

  // Pie: status distribution
  const statusPieData = [
    { name: 'Intake',       value: decedents.filter(d => d.status === 'intake').length },
    { name: 'Storage',      value: stats.inStorage },
    { name: 'Examination',  value: stats.inExam },
    { name: 'Holding',      value: decedents.filter(d => d.status === 'holding').length },
    { name: 'Released',     value: stats.released },
    { name: 'Transferred',  value: decedents.filter(d => d.status === 'transferred').length },
  ].filter(d => d.value > 0);

  // Pie: identification
  const idPieData = [
    { name: 'Identified',        value: decedents.filter(d => d.identification_status === 'identified').length },
    { name: 'Unidentified',      value: stats.unidentified },
    { name: 'Pending',           value: decedents.filter(d => d.identification_status === 'pending_verification').length },
  ].filter(d => d.value > 0);

  const monthlyData = buildMonthlyData(decedents);

  // Bar: exam types
  const examTypeMap = {};
  examinations.forEach(e => {
    const t = e.exam_type?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) || 'Other';
    examTypeMap[t] = (examTypeMap[t] || 0) + 1;
  });
  const examBarData = Object.entries(examTypeMap).map(([name, count]) => ({ name, Count: count }));

  const pendingReleases = releases.filter(r => r.status !== 'completed' && r.status !== 'rejected');
  const upcomingExams = examinations.filter(e => e.status === 'scheduled' || e.status === 'in_progress').slice(0, 4);
  const alertDecedents = decedents.filter(d => d.flags?.length > 0).slice(0, 4);
  const recentCases = decedents.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Activity className="w-3.5 h-3.5 text-blue-500/70" />
              <p className="text-[11px] text-blue-500/70 font-mono uppercase tracking-widest">Operations Intelligence Center</p>
            </div>
            <h1 className="text-lg font-bold text-slate-800">Custiviant Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy · HH:mm")}</p>
          </div>
          <div className="flex items-center gap-3">
            {!loading && todayIntakes.length > 0 && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-700 font-medium">{todayIntakes.length} new intake{todayIntakes.length > 1 ? 's' : ''} today</span>
              </div>
            )}
            <Link to="/intake">
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0">
                <UserPlus className="w-4 h-4" /> New Intake
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Total Cases"   value={loading ? '—' : stats.total}        icon={Users}        colorKey="total"        to="/intake-list" delta={todayIntakes.length} />
          <KpiCard label="In Storage"    value={loading ? '—' : stats.inStorage}    icon={Warehouse}    colorKey="storage"      to="/storage" />
          <KpiCard label="Examination"   value={loading ? '—' : stats.inExam}       icon={FlaskConical} colorKey="exam"         to="/examinations" />
          <KpiCard label="Unidentified"  value={loading ? '—' : stats.unidentified} icon={Fingerprint}  colorKey="unidentified" />
          <KpiCard label="Flagged"       value={loading ? '—' : stats.flagged}      icon={Shield}       colorKey="flagged" />
          <KpiCard label="Released"      value={loading ? '—' : stats.released}     icon={CheckCircle}  colorKey="released" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid xl:grid-cols-3 gap-5">

          {/* Area Chart — 6-month trend */}
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Intake & Release Trend</h2>
                <p className="text-xs text-slate-400 mt-0.5">6-month rolling view</p>
              </div>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            {loading ? (
              <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="intakeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="releaseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                  <Area type="monotone" dataKey="Intakes"  stroke="#3b82f6" strokeWidth={2} fill="url(#intakeGrad)" dot={{ fill: '#3b82f6', r: 3 }} />
                  <Area type="monotone" dataKey="Released" stroke="#22c55e" strokeWidth={2} fill="url(#releaseGrad)" dot={{ fill: '#22c55e', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie — Status Distribution */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Status Distribution</h2>
                <p className="text-xs text-slate-400 mt-0.5">Current active cases</p>
              </div>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            {loading || statusPieData.length === 0 ? (
              <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {statusPieData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                  {statusPieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                      <span className="text-[11px] text-slate-500 truncate">{d.name}</span>
                      <span className="text-[11px] font-semibold text-slate-700 ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid xl:grid-cols-3 gap-5">

          {/* Bar — Exam Types */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Examination Types</h2>
                <p className="text-xs text-slate-400 mt-0.5">All time breakdown</p>
              </div>
              <FlaskConical className="w-4 h-4 text-purple-400" />
            </div>
            {loading || examBarData.length === 0 ? (
              <div className="h-44 bg-slate-100 rounded-xl animate-pulse flex items-center justify-center">
                <p className="text-xs text-slate-400">No examination data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={examBarData} margin={{ top: 4, right: 4, left: -24, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Count" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie — Identification */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Identification Status</h2>
                <p className="text-xs text-slate-400 mt-0.5">Identity verification</p>
              </div>
              <Fingerprint className="w-4 h-4 text-amber-400" />
            </div>
            {loading || idPieData.length === 0 ? (
              <div className="h-44 bg-slate-100 rounded-xl animate-pulse" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={idPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {idPieData.map((_, i) => <Cell key={i} fill={['#22c55e','#ef4444','#f59e0b'][i]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {idPieData.map((d, i) => {
                    const pct = stats.total ? Math.round((d.value / stats.total) * 100) : 0;
                    return (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ['#22c55e','#ef4444','#f59e0b'][i] }} />
                        <span className="text-[11px] text-slate-500 flex-1">{d.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: ['#22c55e','#ef4444','#f59e0b'][i] }} />
                          </div>
                          <span className="text-[11px] font-semibold text-white w-6 text-right">{d.value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Live Activity Feed */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live Activity
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Real-time custody log</p>
              </div>
              <Link to="/audit" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex-1 space-y-1 overflow-hidden">
              {custodyLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No activity logged</p>
              ) : custodyLogs.map(log => (
                <div key={log.id} className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: actionTypeColors[log.action_type] || '#94a3b8' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 capitalize leading-snug">
                      {log.action_type?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {log.decedent_unique_id} · {log.performed_by}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 shrink-0">
                    {log.timestamp
                      ? isToday(new Date(log.timestamp))
                        ? format(new Date(log.timestamp), 'HH:mm')
                        : formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })
                      : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid xl:grid-cols-3 gap-5">

          {/* Recent Cases */}
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Recent Cases</h2>
              <Link to="/intake-list" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : recentCases.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No cases yet</p>
                <Link to="/intake"><Button size="sm" variant="outline" className="mt-3 gap-2"><UserPlus className="w-3.5 h-3.5" /> First Intake</Button></Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentCases.map(d => {
                  const name = d.first_name ? `${d.first_name} ${d.last_name || ''}`.trim() : 'Unidentified';
                  return (
                    <Link key={d.id} to={`/decedent/${d.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50 px-2 -mx-2 rounded-lg transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-blue-700">{name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{d.unique_id}</span>
                          {d.flags?.length > 0 && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                        </div>
                        <p className="text-sm font-medium text-slate-700 truncate mt-0.5">{name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <StatusBadge status={d.status} />
                        <p className="text-[10px] text-slate-400 mt-1">
                          {d.arrival_datetime ? format(new Date(d.arrival_datetime), 'MMM d') : ''}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Alerts + Pending */}
          <div className="space-y-4">
            {/* Alerts */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-red-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Active Alerts
                </h2>
                {alertDecedents.length > 0 && (
                  <span className="text-[10px] font-bold bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">{alertDecedents.length}</span>
                )}
              </div>
              {alertDecedents.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-7 h-7 text-green-500/50 mx-auto mb-1" />
                  <p className="text-xs text-slate-400">All clear — no active alerts</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alertDecedents.map(d => (
                    <Link key={d.id} to={`/decedent/${d.id}`}>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-[10px] text-red-300">{d.unique_id}</p>
                          <p className="text-[11px] text-red-200 truncate">{d.flags?.join(' · ')}</p>
                        </div>
                        <ChevronRight className="w-3 h-3 text-red-400 shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Releases */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <LogOut className="w-4 h-4 text-amber-500" /> Pending Releases
                </h2>
                <span className="font-mono text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full px-2 py-0.5">
                  {loading ? '—' : pendingReleases.length}
                </span>
              </div>
              {pendingReleases.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">No pending releases</p>
              ) : (
                <div className="space-y-2">
                  {pendingReleases.slice(0, 3).map(r => (
                    <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{r.decedent_name || r.decedent_unique_id}</p>
                        <p className="text-[10px] text-slate-500 capitalize">{r.release_type?.replace('_',' ')} · {r.receiving_party_name}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              )}
              <Link to="/release" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5 mt-3">
                Manage releases <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}