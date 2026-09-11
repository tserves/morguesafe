import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, RefreshCw, Eye, AlertTriangle, CheckCircle, X, Loader2, ShieldAlert } from 'lucide-react';

const ENTITY_LABELS = {
  Decedent: 'Decedent Cases', PersonalEffect: 'Personal Effects', StorageUnit: 'Storage Units',
  CustodyLog: 'Custody Log Entries', Examination: 'Examinations', Release: 'Releases', HospitalTransfer: 'Hospital Transfers',
};

export default function DemoDataManagement() {
  const [showReset, setShowReset] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const handlePreview = async () => {
    setShowPreview(true);
    setLoadingPreview(true);
    setError('');
    try {
      const res = await base44.functions.invoke('previewDemoReset', {});
      setPreviewData(res.data);
    } catch (e) {
      setError(e?.message || 'Failed to load preview');
    }
    setLoadingPreview(false);
  };

  const handleReset = async () => {
    if (confirmText !== 'RESET DEMO DATA') return;
    setResetting(true);
    setError('');
    try {
      const res = await base44.functions.invoke('resetDemoData', {});
      setSuccess(res.data);
      setShowReset(false);
      setConfirmText('');
    } catch (e) {
      setError(e?.message || 'Reset failed');
    }
    setResetting(false);
  };

  const closeSuccess = () => {
    setSuccess(null);
    window.location.reload();
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-5 mt-6">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Demo Data Management</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Manage synthetic demo data across all three hospital locations. Resetting will delete all existing demo records and generate a fresh dataset.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2" onClick={handlePreview} disabled={loadingPreview}>
            {loadingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Preview Reset
          </Button>
          <Button variant="destructive" className="gap-2" onClick={() => setShowReset(true)}>
            <RefreshCw className="w-4 h-4" />
            Refresh / Reset Demo Data
          </Button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" /> Reset Preview
              </h3>
              <button onClick={() => setShowPreview(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-5">
              {loadingPreview ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : previewData ? (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-amber-900">{previewData.total} demo records will be removed</p>
                    <p className="text-xs text-amber-700 mt-1">All demo cases, storage units, custody logs, and related records will be deleted and replaced with fresh data.</p>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    {Object.entries(previewData.counts).map(([entity, count]) => (
                      <div key={entity} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{ENTITY_LABELS[entity] || entity}</span>
                        <span className="font-medium text-foreground">{count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-foreground mb-2">Hospital Locations Included:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {previewData.hospitals?.map(h => (
                        <span key={h} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20 capitalize">{h}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex items-start gap-2 text-xs text-success bg-success/10 px-3 py-2 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>Production data, user accounts, roles, settings, and configurations will not be affected.</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setShowPreview(false)}>Close</Button>
              <Button variant="destructive" className="flex-1 gap-2" onClick={() => { setShowPreview(false); setShowReset(true); }}>
                <RefreshCw className="w-4 h-4" /> Proceed to Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-destructive" /> Confirm Demo Data Reset
              </h3>
              <button onClick={() => { setShowReset(false); setConfirmText(''); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-foreground">
                  This will permanently delete <span className="font-semibold">all current demo cases, demo tasks, demo documents, demo alerts, demo transfers, and related demo activity</span> and replace them with a fresh synthetic dataset across all three hospitals.
                </p>
              </div>
              <div>
                <Label>Type <span className="font-mono font-bold text-destructive">RESET DEMO DATA</span> to confirm</Label>
                <Input
                  className="mt-1.5 font-mono"
                  placeholder="RESET DEMO DATA"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmText === 'RESET DEMO DATA' && handleReset()}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">This action cannot be undone. Only demo-tagged records will be affected.</p>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {error}
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => { setShowReset(false); setConfirmText(''); }} disabled={resetting}>Cancel</Button>
              <Button variant="destructive" className="flex-1 gap-2" onClick={handleReset} disabled={resetting || confirmText !== 'RESET DEMO DATA'}>
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Reset Demo Data
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" /> Reset Complete
              </h3>
              <button onClick={closeSuccess} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                <p className="text-sm text-foreground">Demo data has been successfully reset across all three hospital locations.</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Performed by</span>
                  <span className="font-medium text-foreground">{success.resetBy}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date & Time</span>
                  <span className="font-medium text-foreground">{new Date(success.resetAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-foreground mb-2">Records Created:</p>
                <div className="space-y-1">
                  {Object.entries(success.created).map(([entity, count]) => (
                    <div key={entity} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{ENTITY_LABELS[entity] || entity}</span>
                      <span className="font-medium text-foreground">{count}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs border-t pt-1 mt-1">
                    <span className="font-medium text-foreground">Total</span>
                    <span className="font-bold text-foreground">{success.totalCreated}</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">This action has been recorded in the administrative audit log.</p>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t">
              <Button className="flex-1 gap-2" onClick={closeSuccess}>
                <CheckCircle className="w-4 h-4" /> Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}