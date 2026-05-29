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
  CheckCircle, UserPlus, Shield, ArrowRight,
  TrendingUp, Activity, Fingerprint, LogOut,
  ChevronRight, ArrowUpRight, Sparkles, Clock,
  BarChart2, CircleDot
} from 'lucide-react';

/* ── KPI config ───────────────────────────── */
const KPI_CONFIGS = {
  total:        { bg: 'bg-indigo-50', border: 'border-indigo-100', icon_bg: 'bg-indigo-600', label: 'text-indigo-600', value: 'text-indigo-900', bar: '#4f46e5' },
  storage:      { bg: 'bg-sky-50',    border: 'border-sky-100',    icon_bg: 'bg-sky-500',    label: 'text-sky-600',    value: 'text-sky-900',    bar: '#0ea5e9' },
  exam:         { bg: 'bg-violet-50', border: 'border-violet-100', icon_bg: 'bg-violet-600', label: 'text-violet-600', value: 'text-violet-900', bar: '#7c3aed' },
  unidentified: { bg: 'bg-amber-50',  border: 'border-amber-100',  icon_bg: 'bg-amber-500',  label: 'text-amber-600',  value: 'text-amber-900',  bar: '#f59e0b' },
  flagged:      { bg: 'bg-rose-50',   border: 'border-rose-100',   icon_bg: 'bg-rose-500',   label: 'text-rose-600',   value: 'text-rose-900',   bar: '#ef4444' },
  released:     { bg: 'bg-emerald-50',border: 'border-emerald-100',icon_bg: 'bg-emerald-600',label: 'text-emerald-600',value: 'text-emerald-900',bar: '#059669' },
};

function KpiCard({ label, value, icon: Icon, colorKey, to, delta }) {
  const c = KPI_CONFIGS[colorKey];
  const inner = (
    <div className={`relative overflow-hidden rounded-2xl border ${c.bg} ${c.border} p-5 group hover:shadow-card-hover transition-all duration-200 cursor-pointer`}>
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10" style={{ background: c.bar }} />

      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${c.icon_bg} flex items-center justify-center shadow-sm`}>
          <Icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
        </div>
        {delta !== undefined && delta > 0 && (
          <div className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
            <ArrowUpRight className="w-3 h-3" />+{delta}
          </div>
        )}
      </div>

      <p className={`text-[28px] font-bold leading-none ${c.value} mt-1`}>{value ?? '—'}</p>
      <p className={`text-[11px] font-semibold mt-2 uppercase tracking-wider ${c.label}`}>{label}</p>

      {/* Bottom accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-2xl" style={{ background: `linear-gradient(to right, ${c.bar}, transparent)` }} />
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

/* ── Chart helpers ────────────────────────── */
const PIE_COLORS = ['#4f46e5', '#0ea5e9', '#7c3aed', '#f59e0b', '#ef4444', '#059669'];
const ID_COLORS  = ['#059669', '#ef4444', '#f59e0b'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildMonthlyData(decedents) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const label = MONTHS[d.getMonth()];
    const intakes  = decedents.filter(dec => { const a = new Date(dec.arrival_datetime); return a >= d && a <= end; }).length;
    const released = decedents.filter(dec => { const a = new Date(dec.arrival_datetime); return a >= d && a <= end && dec.status === 'released'; }).length;
    return { month: label, Intakes: intakes, Released: released };
  });
}

const actionTypeColors = {
  intake: '#4f46e5', scan_in: '#059669', scan_out: '#f59e0b',
  moved_to_storage: '#0ea5e9', moved_to_examination: '#7c3aed',
  released: '#059669', transferred: '#94a3b8', alert_raised: '#ef4444',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs shadow-float">
      <p className="font-semibold text-slate-500 mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-bold text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Section card wrapper ─────────────────── */
function SectionCard({ children, className }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-card ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, icon: Icon, iconColor = 'text-indigo-500', action }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 leading-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ── Main dashboard ───────────────────────── */
export default function Dashboard() {
  const [decedents,   setDecedents]   = useState([]);
  const [custodyLogs, setCustodyLogs] = useState([]);
  const [examinations,setExaminations]= useState([]);
  const [releases,    setReleases]    = useState([]);
  const [loading,     setLoading]     = useState(true);

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

  const statusPieData = [
    { name: 'Intake',      value: decedents.filter(d => d.status === 'intake').length },
    { name: 'Storage',     value: stats.inStorage },
    { name: 'Examination', value: stats.inExam },
    { name: 'Holding',     value: decedents.filter(d => d.status === 'holding').length },
    { name: 'Released',    value: stats.released },
    { name: 'Transferred', value: decedents.filter(d => d.status === 'transferred').length },
  ].filter(d => d.value > 0);

  const idPieData = [
    { name: 'Identified',   value: decedents.filter(d => d.identification_status === 'identified').length },
    { name: 'Unidentified', value: stats.unidentified },
    { name: 'Pending',      value: decedents.filter(d => d.identification_status === 'pending_verification').length },
  ].filter(d => d.value > 0);

  const monthlyData = buildMonthlyData(decedents);

  const examTypeMap = {};
  examinations.forEach(e => {
    const t = e.exam_type?.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Other';
    examTypeMap[t] = (examTypeMap[t] || 0) + 1;
  });
  const examBarData = Object.entries(examTypeMap).map(([name, count]) => ({ name, Count: count }));

  const pendingReleases  = releases.filter(r => r.status !== 'completed' && r.status !== 'rejected');
  const alertDecedents   = decedents.filter(d => d.flags?.length > 0).slice(0, 4);
  const recentCases      = decedents.slice(0, 6);

  const SkeletonBlock = ({ h = 'h-40' }) => <div className={`${h} rounded-xl skeleton`} />;

  return (
    <div className="min-h-screen bg-gradient-mesh">
      {/* ── Page header ── */}
      <div className="border-b border-slate-200/80 bg-white/70 backdrop-blur-xl px-6 py-4 sticky top-14 z-20">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <p className="text-[11px] text-indigo-600 font-semibold uppercase tracking-widest">Operations Intelligence</p>
            </div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">Command Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            {!loading && todayIntakes.length > 0 && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3.5 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs text-emerald-700 font-semibold">{todayIntakes.length} intake{todayIntakes.length > 1 ? 's' : ''} today</span>
              </div>
            )}
            <Link to="/intake">
              <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-xl h-9 px-4 font-semibold">
                <UserPlus className="w-3.5 h-3.5" /> New Intake
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-5">

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {loading ? [1,2,3,4,5,6].map(i => <div key={i} className="rounded-2xl skeleton h-28" />) : <>
            <KpiCard label="Total Cases"   value={stats.total}        icon={Users}        colorKey="total"        to="/intake-list" delta={todayIntakes.length} />
            <KpiCard label="In Storage"    value={stats.inStorage}    icon={Warehouse}    colorKey="storage"      to="/storage" />
            <KpiCard label="Examination"   value={stats.inExam}       icon={FlaskConical} colorKey="exam"         to="/examinations" />
            <KpiCard label="Unidentified"  value={stats.unidentified} icon={Fingerprint}  colorKey="unidentified" />
            <KpiCard label="Flagged"       value={stats.flagged}      icon={AlertTriangle}colorKey="flagged" />
            <KpiCard label="Released"      value={stats.released}     icon={CheckCircle}  colorKey="released" />
          </>}
        </div>

        {/* Row 2 — Trend + Status Pie */}
        <div className="grid xl:grid-cols-3 gap-5">
          <SectionCard className="xl:col-span-2">
            <SectionHeader title="Intake & Release Trend" subtitle="6-month rolling window" icon={TrendingUp} iconColor="text-indigo-500"
              action={<span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">Last 6 months</span>}
            />
            <div className="p-5">
              {loading ? <SkeletonBlock /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={monthlyData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gIntake"  x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gRelease" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#059669" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b', fontFamily: 'Inter', fontWeight: '500' }} />
                    <Area type="monotone" dataKey="Intakes"  stroke="#4f46e5" strokeWidth={2.5} fill="url(#gIntake)"  dot={{ fill: '#4f46e5', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="Released" stroke="#059669" strokeWidth={2.5} fill="url(#gRelease)" dot={{ fill: '#059669', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </SectionCard>

          <SectionCard>
            <SectionHeader title="Status Distribution" subtitle="Active cases breakdown" icon={CircleDot} iconColor="text-violet-500" />
            <div className="p-5">
              {loading || statusPieData.length === 0 ? <SkeletonBlock h="h-48" /> : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {statusPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-1">
                    {statusPieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-[11px] text-slate-500 truncate flex-1">{d.name}</span>
                        <span className="text-[11px] font-bold text-slate-700">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Row 3 — Bar + Id Pie + Activity */}
        <div className="grid xl:grid-cols-3 gap-5">

          <SectionCard>
            <SectionHeader title="Examination Types" subtitle="All time breakdown" icon={BarChart2} iconColor="text-violet-500" />
            <div className="p-5">
              {loading || examBarData.length === 0 ? (
                <div className="h-44 rounded-xl skeleton flex items-center justify-center">
                  <p className="text-xs text-slate-400">No examination data</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={examBarData} margin={{ top: 4, right: 4, left: -24, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'Inter' }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Count" fill="url(#barGrad)" radius={[6, 6, 0, 0]}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </SectionCard>

          <SectionCard>
            <SectionHeader title="Identification" subtitle="Verification status" icon={Fingerprint} iconColor="text-amber-500" />
            <div className="p-5">
              {loading || idPieData.length === 0 ? <SkeletonBlock h="h-44" /> : (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={idPieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={4} dataKey="value" strokeWidth={0}>
                        {idPieData.map((_, i) => <Cell key={i} fill={ID_COLORS[i]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2.5 mt-2">
                    {idPieData.map((d, i) => {
                      const pct = stats.total ? Math.round((d.value / stats.total) * 100) : 0;
                      return (
                        <div key={d.name} className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ID_COLORS[i] }} />
                          <span className="text-[11px] text-slate-600 flex-1 font-medium">{d.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: ID_COLORS[i] }} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 w-5 text-right">{d.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </SectionCard>

          {/* Live Activity */}
          <SectionCard className="flex flex-col">
            <SectionHeader
              title="Live Activity"
              subtitle="Real-time custody log"
              icon={Activity}
              iconColor="text-emerald-500"
              action={
                <Link to="/audit" className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                  All logs <ArrowRight className="w-3 h-3" />
                </Link>
              }
            />
            <div className="flex-1 p-4 space-y-0.5 overflow-hidden">
              {custodyLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="w-7 h-7 text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400">No activity logged yet</p>
                </div>
              ) : custodyLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 px-2.5 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 ring-2 ring-white" style={{ background: actionTypeColors[log.action_type] || '#94a3b8' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 capitalize leading-snug">
                      {log.action_type?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {log.decedent_unique_id} · {log.performed_by}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {log.timestamp
                      ? isToday(new Date(log.timestamp))
                        ? format(new Date(log.timestamp), 'HH:mm')
                        : formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })
                      : ''}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Row 4 — Recent Cases + Alerts + Releases */}
        <div className="grid xl:grid-cols-3 gap-5">

          {/* Recent Cases */}
          <SectionCard className="xl:col-span-2">
            <SectionHeader
              title="Recent Cases"
              subtitle={`${recentCases.length} most recent`}
              icon={Users}
              iconColor="text-indigo-500"
              action={
                <Link to="/intake-list" className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              }
            />
            <div className="p-4">
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl skeleton" />)}</div>
              ) : recentCases.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">No cases yet</p>
                  <Link to="/intake">
                    <Button size="sm" className="mt-3 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                      <UserPlus className="w-3.5 h-3.5" /> First Intake
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {recentCases.map(d => {
                    const name = d.first_name ? `${d.first_name} ${d.last_name || ''}`.trim() : 'Unidentified';
                    const initials = name[0].toUpperCase();
                    const colorIndex = name.charCodeAt(0) % 5;
                    const avatarColors = ['bg-indigo-100 text-indigo-700', 'bg-violet-100 text-violet-700', 'bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700'];
                    return (
                      <Link key={d.id} to={`/decedent/${d.id}`}
                        className="flex items-center gap-3.5 py-3 hover:bg-slate-50 px-2 -mx-2 rounded-xl transition-colors group">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${avatarColors[colorIndex]}`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md font-medium">{d.unique_id}</span>
                            {d.flags?.length > 0 && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                          </div>
                          <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <StatusBadge status={d.status} />
                          <p className="text-[10px] text-slate-400 font-medium">
                            {d.arrival_datetime ? format(new Date(d.arrival_datetime), 'MMM d') : ''}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Right column */}
          <div className="space-y-4">
            {/* Active Alerts */}
            <div className="bg-white rounded-2xl border border-rose-200/80 shadow-card overflow-hidden">
              <div className="bg-gradient-to-r from-rose-50 to-orange-50 px-5 py-4 border-b border-rose-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center">
                      <AlertTriangle className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-rose-900 leading-tight">Active Alerts</p>
                      <p className="text-[10px] text-rose-400">Flagged cases</p>
                    </div>
                  </div>
                  {alertDecedents.length > 0 && (
                    <span className="text-[11px] font-bold bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                      {alertDecedents.length}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                {alertDecedents.length === 0 ? (
                  <div className="flex flex-col items-center py-5 text-center">
                    <CheckCircle className="w-7 h-7 text-emerald-400 mb-1.5" />
                    <p className="text-xs font-medium text-slate-500">All clear — no alerts</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {alertDecedents.map(d => (
                      <Link key={d.id} to={`/decedent/${d.id}`}>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-100 hover:border-rose-300 transition-colors group">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-[10px] font-semibold text-rose-600">{d.unique_id}</p>
                            <p className="text-[11px] text-rose-700 truncate">{d.flags?.join(' · ')}</p>
                          </div>
                          <ChevronRight className="w-3 h-3 text-rose-400 group-hover:text-rose-600 shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pending Releases */}
            <SectionCard>
              <SectionHeader
                title="Pending Releases"
                subtitle={`${loading ? '—' : pendingReleases.length} awaiting`}
                icon={LogOut}
                iconColor="text-amber-500"
                action={
                  <Link to="/release" className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 transition-colors">
                    Manage <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
              <div className="p-4">
                {pendingReleases.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3 font-medium">No pending releases</p>
                ) : (
                  <div className="space-y-2">
                    {pendingReleases.slice(0, 3).map(r => (
                      <div key={r.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                        <div className="w-1.5 h-8 rounded-full bg-amber-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{r.decedent_name || r.decedent_unique_id}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{r.release_type?.replace('_',' ')} · {r.receiving_party_name}</p>
                        </div>
                        <StatusBadge status={r.status} size="xs" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>

      </div>
    </div>
  );
}