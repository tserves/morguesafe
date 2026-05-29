import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, MapPin, Shield, Package,
  FlaskConical, LogOut, AlertTriangle, CheckCircle,
  Loader2, QrCode, User, Calendar, Activity,
  Hash, Move, ChevronRight
} from 'lucide-react';
import LabelPrintModal from '@/components/LabelPrintModal';
import { format } from 'date-fns';

export default function DecedentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [decedent, setDecedent] = useState(null);
  const [custodyLogs, setCustodyLogs] = useState([]);
  const [effects, setEffects] = useState([]);
  const [examinations, setExaminations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingStatus, setMovingStatus] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [moveNote, setMoveNote] = useState('');
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Decedent.filter({ id }),
      base44.entities.CustodyLog.filter({ decedent_id: id }),
      base44.entities.PersonalEffect.filter({ decedent_id: id }),
      base44.entities.Examination.filter({ decedent_id: id }),
    ]).then(([d, c, e, ex]) => {
      setDecedent(d[0]);
      setCustodyLogs(c.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      setEffects(e);
      setExaminations(ex);
      setLoading(false);
    });
  }, [id]);

  const handleStatusMove = async (newStatus) => {
    setMovingStatus(true);
    const updated = await base44.entities.Decedent.update(id, {
      status: newStatus,
      storage_location_label: newLocation || decedent.storage_location_label
    });
    await base44.entities.CustodyLog.create({
      decedent_id: id, decedent_unique_id: decedent.unique_id,
      action_type: `moved_to_${newStatus}`,
      from_location: decedent.storage_location_label || 'Unknown',
      to_location: newLocation || newStatus,
      performed_by: 'Current User', performed_by_role: 'Morgue Technician',
      timestamp: new Date().toISOString(), notes: moveNote, verification_method: 'manual',
    });
    setDecedent(updated);
    setCustodyLogs(prev => [{ id: Date.now(), action_type: `moved_to_${newStatus}`, performed_by: 'Current User', timestamp: new Date().toISOString(), notes: moveNote }, ...prev]);
    setMovingStatus(false);
    setNewLocation('');
    setMoveNote('');
  };

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-sm text-slate-400 font-medium">Loading case file...</p>
      </div>
    </div>
  );

  if (!decedent) return (
    <div className="p-6 text-center">
      <p className="text-slate-500 font-medium">Case not found</p>
      <Button variant="outline" onClick={() => navigate('/')} className="mt-3 rounded-xl">Back to Dashboard</Button>
    </div>
  );

  const name = decedent.first_name
    ? `${decedent.first_name} ${decedent.last_name || ''}`.trim()
    : 'Unidentified Decedent';

  const nextStatuses = {
    intake:      ['storage', 'examination'],
    storage:     ['examination', 'holding', 'released'],
    examination: ['storage', 'holding', 'released'],
    holding:     ['released', 'transferred'],
  };
  const availableNext = nextStatuses[decedent.status] || [];

  const statusActionColors = {
    storage:     'bg-sky-600 hover:bg-sky-700',
    examination: 'bg-violet-600 hover:bg-violet-700',
    holding:     'bg-amber-600 hover:bg-amber-700',
    released:    'bg-emerald-600 hover:bg-emerald-700',
    transferred: 'bg-slate-600 hover:bg-slate-700',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5 mb-6">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0 mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">{decedent.unique_id}</span>
              <StatusBadge status={decedent.status} size="md" />
              <StatusBadge status={decedent.identification_status} size="md" />
              {decedent.flags?.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> {decedent.flags.length} flag{decedent.flags.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900">{name}</h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Arrived {decedent.arrival_datetime ? format(new Date(decedent.arrival_datetime), 'MMMM d, yyyy · HH:mm') : '—'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 font-medium" onClick={() => setShowLabel(true)}>
              <QrCode className="w-3.5 h-3.5" /> Label
            </Button>
            <Link to="/release">
              <Button size="sm" className="gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                <LogOut className="w-3.5 h-3.5" /> Release
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">

          {/* Case Details */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5">
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="font-bold text-slate-800">Case Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {[
                ['Date of Birth', decedent.date_of_birth ? format(new Date(decedent.date_of_birth), 'MMM d, yyyy') : '—'],
                ['Gender', decedent.gender || '—'],
                ['Source', `${decedent.source_name || ''} (${decedent.source_type?.replace('_',' ') || '—'})`],
                ['Arrival', decedent.arrival_datetime ? format(new Date(decedent.arrival_datetime), 'MMM d, yyyy HH:mm') : '—'],
                ['Condition', decedent.condition_on_arrival?.replace('_',' ') || '—'],
                ['Case #', decedent.case_number || '—'],
                ['L.E. Case', decedent.law_enforcement_case || '—'],
                ['Autopsy Required', decedent.requires_autopsy ? 'Yes' : 'No'],
                ['Storage Location', decedent.storage_location_label || '—'],
                ['Intake Officer', decedent.intake_officer || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-sm font-semibold text-slate-700 capitalize">{value}</p>
                </div>
              ))}
            </div>
            {(decedent.physical_description || decedent.identifying_marks) && (
              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                {decedent.physical_description && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Physical Description</p>
                    <p className="text-sm text-slate-600">{decedent.physical_description}</p>
                  </div>
                )}
                {decedent.identifying_marks && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Identifying Marks</p>
                    <p className="text-sm text-slate-600">{decedent.identifying_marks}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Transfer / Move */}
          {availableNext.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5">
              <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <Move className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="font-bold text-slate-800">Transfer / Move</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">New Location Label</label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white focus:border-indigo-400 focus:outline-none transition-colors"
                    placeholder="e.g. Room A - Rack 2 - Tray 4"
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Transfer Note</label>
                  <Textarea className="rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400" rows={2} placeholder="Reason for transfer..." value={moveNote} onChange={e => setMoveNote(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableNext.map(s => (
                    <Button key={s} size="sm" onClick={() => handleStatusMove(s)} disabled={movingStatus}
                      className={`gap-1.5 text-white rounded-xl font-semibold shadow-sm ${statusActionColors[s] || 'bg-slate-600 hover:bg-slate-700'}`}>
                      {movingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      Move to {s.replace('_',' ')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Examinations */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4 text-violet-600" />
                </div>
                <h2 className="font-bold text-slate-800">Examinations</h2>
              </div>
              <Link to="/examinations">
                <Button size="sm" variant="outline" className="gap-1.5 rounded-xl border-slate-200 text-slate-600 font-medium text-xs h-8">
                  <FlaskConical className="w-3 h-3" /> Schedule
                </Button>
              </Link>
            </div>
            {examinations.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium text-center py-4">No examinations scheduled</p>
            ) : examinations.map(e => (
              <div key={e.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{e.exam_type?.replace(/_/g,' ')}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{e.pathologist_name}</p>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
          </div>

          {/* Personal Effects */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                  <Package className="w-4 h-4 text-orange-600" />
                </div>
                <h2 className="font-bold text-slate-800">Personal Effects</h2>
              </div>
              <Link to="/effects">
                <Button size="sm" variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-medium text-xs h-8">Log Item</Button>
              </Link>
            </div>
            {effects.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium text-center py-4">No effects recorded</p>
            ) : (
              <div className="space-y-2">
                {effects.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{e.item_name}</p>
                      <p className="text-xs text-slate-400">{e.category} · Qty: {e.quantity}</p>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chain of Custody sidebar */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5 h-fit sticky top-20">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 leading-tight">Chain of Custody</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">{custodyLogs.length} events recorded</p>
            </div>
          </div>

          <div className="space-y-0">
            {custodyLogs.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium text-center py-6">No custody events logged</p>
            ) : custodyLogs.map((log, i) => {
              const actionColorMap = {
                intake: 'bg-indigo-500', moved_to_storage: 'bg-sky-500', moved_to_examination: 'bg-violet-500',
                moved_to_holding: 'bg-amber-500', released: 'bg-emerald-500', alert_raised: 'bg-rose-500',
              };
              const dotColor = actionColorMap[log.action_type] || 'bg-slate-400';
              return (
                <div key={log.id || i} className="relative pl-6 pb-4 last:pb-0">
                  {i < custodyLogs.length - 1 && (
                    <div className="absolute left-[9px] top-5 bottom-0 w-px bg-gradient-to-b from-slate-200 to-transparent" />
                  )}
                  <div className={`absolute left-0 top-1 w-5 h-5 rounded-full ${dotColor} flex items-center justify-center shadow-sm`}>
                    <div className="w-2 h-2 rounded-full bg-white/80" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-700 capitalize leading-tight">
                    {log.action_type?.replace(/_/g, ' ')}
                  </p>
                  {log.to_location && (
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 shrink-0" />{log.to_location}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {log.performed_by} · {log.timestamp ? format(new Date(log.timestamp), 'MMM d, HH:mm') : ''}
                  </p>
                  {log.notes && <p className="text-[10px] text-slate-400/70 mt-0.5 italic truncate">{log.notes}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showLabel && <LabelPrintModal decedent={decedent} onClose={() => setShowLabel(false)} />}
    </div>
  );
}