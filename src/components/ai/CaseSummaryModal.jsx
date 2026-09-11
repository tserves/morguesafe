import React, { useState } from "react";
import { Sparkles, Loader2, Save, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

export default function CaseSummaryModal({ decedentId, decedentUniqueId, open, onOpenChange }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await base44.functions.invoke("generateCaseSummary", { decedent_id: decedentId });
      setSummary(res.data);
    } catch (err) {
      setSummary({ summary_text: `Error generating summary: ${err.message}`, summary_data: null });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setSaved(true);
    onOpenChange?.(false);
  };

  const handlePrint = () => {
    if (!summary?.summary_text) return;
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Case Summary - ${decedentUniqueId}</title><style>body{font-family:Inter,sans-serif;padding:40px;max-width:800px;margin:auto}h1{font-size:18px}.ai-label{background:#f0f0f0;padding:2px 8px;border-radius:4px;font-size:11px}.summary{white-space:pre-wrap;margin-top:20px;line-height:1.6}</style></head><body><h1>Case Summary: ${decedentUniqueId}</h1><span class="ai-label">⚠ AI-Generated Content — Review Required</span><div class="summary">${summary.summary_text}</div></body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            AI Case Summary
            {decedentUniqueId && <span className="text-sm font-mono text-muted-foreground ml-2">{decedentUniqueId}</span>}
          </DialogTitle>
        </DialogHeader>

        {!summary && !loading && (
          <div className="py-8 text-center">
            <Sparkles className="w-10 h-10 text-purple-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Generate an AI-powered summary of this case, including current status, outstanding tasks, active holds, and recommended next actions.</p>
            <Button onClick={generate}>
              <Sparkles className="w-4 h-4 mr-2" />Generate AI Case Summary
            </Button>
          </div>
        )}

        {loading && (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 text-purple-400 mx-auto mb-3 animate-spin" />
            <p className="text-sm text-muted-foreground">Analyzing case data and generating summary...</p>
          </div>
        )}

        {summary && !loading && (
          <div className="space-y-4">
            <Badge className="bg-purple-100 text-purple-700" variant="secondary">
              <Sparkles className="w-3 h-3 mr-1" />AI-Generated — Review Required
            </Badge>

            {summary.summary_data && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Current Status</p>
                  <p className="font-medium capitalize">{summary.summary_data.current_status}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time at Stage</p>
                  <p className="font-medium">{summary.summary_data.time_at_current_stage}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Storage</p>
                  <p className="font-medium">{summary.summary_data.storage_location}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Outstanding Tasks</p>
                  <p className="font-medium">{summary.summary_data.outstanding_tasks?.length || 0}</p>
                </div>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Summary</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{summary.summary_text}</p>
            </div>

            {summary.summary_data?.release_blockers?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">Release Blockers:</p>
                <ul className="text-xs text-red-600 space-y-0.5">
                  {summary.summary_data.release_blockers.map((b, i) => <li key={i}>• {b}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {summary && !loading && (
            <>
              <Button variant="outline" onClick={handlePrint} size="sm">
                <Printer className="w-4 h-4 mr-2" />Print
              </Button>
              <Button onClick={handleSave} size="sm">
                <Save className="w-4 h-4 mr-2" />{saved ? "Saved" : "Save & Close"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}