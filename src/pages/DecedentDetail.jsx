import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, MapPin, Clock, User, Shield, Package,
  FlaskConical, LogOut, AlertTriangle, CheckCircle,
  ChevronDown, Loader2, QrCode, Heart
} from 'lucide-react';
import LabelPrintModal from '@/components/LabelPrintModal';
import DonorBadge from '@/components/DonorBadge';
import { format } from 'date-fns';

const STATUS_FLOW = ['intake', 'storage', 'examination', 'holding', 'released'];

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
      setCustodyLogs(c.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
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
      decedent_id: id,
      decedent_unique_id: decedent.unique_id,
      action_type: `moved_to_${newStatus}`,
      from_location: decedent.storage_location_label || 'Unknown',
      to_location: newLocation || newStatus,
      performed_by: 'Current User',
      performed_by_role: 'Morgue Technician',
      timestamp: new Date().toISOString(),
      notes: moveNote,
      verification_method: 'manual',
    });
    setDecedent(updated);
    setCustodyLogs(prev => [{
      id: Date.now(),
      action_type: `moved_to_${newStatus}`,
      performed_by: 'Current User',
      timestamp: new Date().toISOString(),
      notes: moveNote,
    }, ...prev]);
    setMovingStatus(false);
    setNewLocation('');
    setMoveNote('');
  };

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!decedent) return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground">Case not found</p>
      <Button variant="outline" onClick={() => navigate('/')} className="mt-3">Back to Dashboard</Button>
    </div>
  );

  const name = decedent.first_name
    ? `${decedent.first_name} ${decedent.last_name || ''}`.trim()
    : 'Unidentified Decedent';

  const nextStatuses = {
    intake: ['storage', 'examination'],
    storage: ['examination', 'holding', 'released'],
    examination: ['storage', 'holding', 'released'],
    holding: ['released', 'transferred'],
  };
  const availableNext = nextStatuses[decedent.status] || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded text-muted-foreground">{decedent.unique_id}</span>
            <StatusBadge status={decedent.status} />
            <StatusBadge status={decedent.identification_status} />
            <DonorBadge decedent={decedent} />
          </div>
          <h1 className="text-xl font-semibold">{name}</h1>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowLabel(true)}>
          <QrCode className="w-3.5 h-3.5" /> Label
        </Button>
        <Link to="/release">
          <Button variant="outline" size="sm" className="gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> Release
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Details Card */}
          <div className="bg-card border rounded-xl p-5">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">Case Details</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
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
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium capitalize mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            {decedent.physical_description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-1">Physical Description</p>
                <p className="text-sm">{decedent.physical_description}</p>
              </div>
            )}
            {decedent.identifying_marks && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Identifying Marks</p>
                <p className="text-sm">{decedent.identifying_marks}</p>
              </div>
            )}
          </div>

          {/* Donor Info Card */}
          {decedent.is_donor === 'yes' && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5">
              <h2 className="font-semibold text-sm text-red-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4 fill-red-400" /> Organ & Tissue Donation
                <span className="ml-auto text-xs px-2 py-0.5 bg-red-100 rounded-full">
                  {decedent.donation_status?.replace(/_/g, ' ') || 'Pending Assessment'}
                </span>
              </h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {decedent.donation_organization && (
                  <div><p className="text-xs text-muted-foreground">Organization</p><p className="font-medium">{decedent.donation_organization}</p></div>
                )}
                {decedent.donation_coordinator_name && (
                  <div><p className="text-xs text-muted-foreground">Coordinator</p><p className="font-medium">{decedent.donation_coordinator_name}</p></div>
                )}
                {decedent.donation_coordinator_contact && (
                  <div><p className="text-xs text-muted-foreground">Coordinator Contact</p><p className="font-medium">{decedent.donation_coordinator_contact}</p></div>
                )}
                {decedent.donor_card_verified && (
                  <div><p className="text-xs text-muted-foreground">Card Verified</p><p className="font-medium capitalize">{decedent.donor_card_verified}</p></div>
                )}
                {decedent.recovery_team_assigned && (
                  <div><p className="text-xs text-muted-foreground">Recovery Team</p><p className="font-medium">{decedent.recovery_team_assigned}</p></div>
                )}
                {decedent.recovery_facility && (
                  <div><p className="text-xs text-muted-foreground">Recovery Facility</p><p className="font-medium">{decedent.recovery_facility}</p></div>
                )}
                {decedent.recovery_datetime && (
                  <div><p className="text-xs text-muted-foreground">Recovery Date</p><p className="font-medium">{format(new Date(decedent.recovery_datetime), 'MMM d, yyyy HH:mm')}</p></div>
                )}
              </div>
              {(decedent.organs_for_donation?.length > 0 || decedent.tissues_for_donation?.length > 0) && (
                <div className="mt-4 pt-4 border-t border-red-200 space-y-2">
                  {decedent.organs_for_donation?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Organs</p>
                      <div className="flex flex-wrap gap-1.5">
                        {decedent.organs_for_donation.map(o => (
                          <span key={o} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full capitalize border border-red-200">{o.replace('_',' ')}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {decedent.tissues_for_donation?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Tissues</p>
                      <div className="flex flex-wrap gap-1.5">
                        {decedent.tissues_for_donation.map(t => (
                          <span key={t} className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded-full capitalize border border-rose-200">{t.replace('_',' ')}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {decedent.donation_special_handling && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-xs text-muted-foreground">Special Handling</p>
                  <p className="text-sm mt-0.5">{decedent.donation_special_handling}</p>
                </div>
              )}
            </div>
          )}

          {/* Move Action */}
          {availableNext.length > 0 && (
            <div className="bg-card border rounded-xl p-5">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">Transfer / Move</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">New Location Label</label>
                  <input
                    className="mt-1.5 w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="e.g. Room A - Rack 2 - Tray 4"
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Transfer Note</label>
                  <Textarea
                    className="mt-1.5"
                    rows={2}
                    placeholder="Reason for transfer..."
                    value={moveNote}
                    onChange={e => setMoveNote(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableNext.map(s => (
                    <Button
                      key={s}
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusMove(s)}
                      disabled={movingStatus}
                    >
                      {movingStatus ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      Move to {s.replace('_',' ')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Examinations */}
          <div className="bg-card border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Examinations</h2>
              <Link to="/examinations">
                <Button size="sm" variant="outline" className="gap-1"><FlaskConical className="w-3 h-3" />Schedule</Button>
              </Link>
            </div>
            {examinations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No examinations scheduled</p>
            ) : examinations.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{e.exam_type?.replace('_',' ')}</p>
                  <p className="text-xs text-muted-foreground">{e.pathologist_name}</p>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
          </div>

          {/* Personal Effects */}
          <div className="bg-card border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Package className="w-4 h-4" />Personal Effects
              </h2>
              <Link to="/effects">
                <Button size="sm" variant="outline">Log Item</Button>
              </Link>
            </div>
            {effects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No effects recorded</p>
            ) : (
              <div className="space-y-2">
                {effects.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{e.item_name}</p>
                      <p className="text-xs text-muted-foreground">{e.category} · Qty: {e.quantity}</p>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showLabel && <LabelPrintModal decedent={decedent} onClose={() => setShowLabel(false)} />}

      {/* Chain of Custody Timeline */}
        <div className="bg-card border rounded-xl p-5 h-fit">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Chain of Custody
          </h2>
          <div className="space-y-0">
            {custodyLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No custody events logged</p>
            ) : custodyLogs.map((log, i) => (
              <div key={log.id || i} className="relative pl-5 pb-4 last:pb-0">
                {i < custodyLogs.length - 1 && (
                  <div className="absolute left-1.5 top-3 bottom-0 w-px bg-border" />
                )}
                <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-primary ring-2 ring-background" />
                <p className="text-xs font-medium text-foreground capitalize">
                  {log.action_type?.replace(/_/g, ' ')}
                </p>
                {log.to_location && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5" />{log.to_location}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {log.performed_by} · {log.timestamp ? format(new Date(log.timestamp), 'MMM d, HH:mm') : ''}
                </p>
                {log.notes && <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">{log.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}