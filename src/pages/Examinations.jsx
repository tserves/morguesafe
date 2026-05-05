import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FlaskConical, Plus, CheckCircle, Loader2, X, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function Examinations() {
  const [examinations, setExaminations] = useState([]);
  const [decedents, setDecedents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({
    decedent_id: '', exam_type: '', scheduled_datetime: '',
    pathologist_name: '', status: 'scheduled', notes: ''
  });

  useEffect(() => {
    Promise.all([
      base44.entities.Examination.list('-scheduled_datetime', 100),
      base44.entities.Decedent.list('-arrival_datetime', 200),
    ]).then(([e, d]) => {
      setExaminations(e);
      setDecedents(d.filter(d => d.status !== 'released'));
      setLoading(false);
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const decedent = decedents.find(d => d.id === form.decedent_id);
    const exam = await base44.entities.Examination.create({
      ...form,
      decedent_unique_id: decedent?.unique_id,
      decedent_name: decedent ? `${decedent.first_name || 'Unidentified'} ${decedent.last_name || ''}`.trim() : '',
    });

    // Log custody action
    await base44.entities.CustodyLog.create({
      decedent_id: form.decedent_id,
      decedent_unique_id: decedent?.unique_id,
      action_type: 'examined',
      performed_by: form.pathologist_name || 'System',
      performed_by_role: 'Pathologist',
      timestamp: new Date().toISOString(),
      notes: `Examination scheduled: ${form.exam_type?.replace(/_/g,' ')}`,
    });

    setExaminations(prev => [exam, ...prev]);
    setSaving(false);
    setShowForm(false);
    setForm({ decedent_id: '', exam_type: '', scheduled_datetime: '', pathologist_name: '', status: 'scheduled', notes: '' });
  };

  const handleUpdateStatus = async (exam, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'in_progress') updates.started_datetime = new Date().toISOString();
    if (newStatus === 'completed') updates.completed_datetime = new Date().toISOString();
    const updated = await base44.entities.Examination.update(exam.id, updates);
    setExaminations(prev => prev.map(e => e.id === exam.id ? updated : e));
  };

  const filtered = statusFilter === 'all' ? examinations : examinations.filter(e => e.status === statusFilter);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Examinations"
        subtitle="Autopsy and examination scheduling"
        actions={
          <Button size="sm" className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Schedule Exam
          </Button>
        }
      />

      {/* Form */}
      {showForm && (
        <div className="bg-card border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Schedule Examination</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Decedent *</Label>
              <Select value={form.decedent_id} onValueChange={v => set('decedent_id', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select case" /></SelectTrigger>
                <SelectContent>
                  {decedents.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.unique_id} — {d.first_name || 'Unidentified'} {d.last_name || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Exam Type *</Label>
              <Select value={form.exam_type} onValueChange={v => set('exam_type', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {['external_examination','full_autopsy','partial_autopsy','toxicology','forensic_analysis','identification_exam'].map(t => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Scheduled Date & Time</Label>
              <Input type="datetime-local" className="mt-1.5" value={form.scheduled_datetime} onChange={e => set('scheduled_datetime', e.target.value)} />
            </div>
            <div>
              <Label>Assigned Pathologist</Label>
              <Input className="mt-1.5" value={form.pathologist_name} onChange={e => set('pathologist_name', e.target.value)} placeholder="Pathologist name" />
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Textarea className="mt-1.5" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.decedent_id || !form.exam_type}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Schedule
            </Button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all','scheduled','in_progress','completed','cancelled','pending_review'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s === 'all' ? 'All' : s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <FlaskConical className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No examinations {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'scheduled'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(exam => (
            <div key={exam.id} className="bg-card border rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{exam.decedent_unique_id}</span>
                    <StatusBadge status={exam.status} />
                  </div>
                  <p className="font-semibold">{exam.decedent_name || 'Unknown Decedent'}</p>
                  <p className="text-sm text-muted-foreground capitalize mt-0.5">
                    {exam.exam_type?.replace(/_/g,' ')}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                    {exam.scheduled_datetime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Scheduled: {format(new Date(exam.scheduled_datetime), 'MMM d, HH:mm')}
                      </span>
                    )}
                    {exam.pathologist_name && (
                      <span>Dr. {exam.pathologist_name}</span>
                    )}
                  </div>
                  {exam.findings_summary && (
                    <p className="text-sm mt-2 text-foreground/80 border-t pt-2">{exam.findings_summary}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {exam.status === 'scheduled' && (
                    <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(exam, 'in_progress')}>
                      Start
                    </Button>
                  )}
                  {exam.status === 'in_progress' && (
                    <Button size="sm" onClick={() => handleUpdateStatus(exam, 'completed')} className="gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Complete
                    </Button>
                  )}
                  {exam.status === 'completed' && exam.is_signed_off && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />Signed Off
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}