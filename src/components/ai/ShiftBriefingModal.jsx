import React, { useState } from "react";
import { Sparkles, Loader2, Save, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

export default function ShiftBriefingModal({ hospitalLocation, open, onOpenChange }) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [briefingType, setBriefingType] = useState("shift_handoff");

  const generate = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("generateShiftBriefing", {
        hospital_location: hospitalLocation || "all",
        briefing_type: briefingType,
      });
      setBriefing(res.data);
    } catch (err) {
      setBriefing({ briefing_text: `Error generating briefing: ${err.message}`, briefing_data: null });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!briefing?.briefing_text) return;
    const win = window.open("", "_blank");
    const hospitalLabel = hospitalLocation === "all" || !hospitalLocation ? "All Hospitals" : hospitalLocation;
    win.document.write(`<html><head><title>Shift Briefing - ${hospitalLabel}</title><style>body{font-family:Inter,sans-serif;padding:40px;max-width:800px;margin:auto}h1{font-size:18px}.ai-label{background:#f0f0f0;padding:2px 8px;border-radius:4px;font-size:11px}.briefing{white-space:pre-wrap;margin-top:20px;line-height:1.6}</style></head><body><h1>Shift Briefing: ${hospitalLabel}</h1><span class="ai-label">⚠ AI-Generated Content — Review Required</span><div class="briefing">${briefing.briefing_text}</div></body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            AI Shift Briefing
            <span className="text-sm text-muted-foreground ml-2 capitalize">
              {hospitalLocation === "all" || !hospitalLocation ? "All Hospitals" : hospitalLocation}
            </span>
          </DialogTitle>
        </DialogHeader>

        {!briefing && !loading && (
          <div className="py-6 text-center">
            <Sparkles className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Generate an AI-powered shift briefing covering new cases, releases, urgent tasks, and capacity alerts.</p>
            <div className="flex gap-2 justify-center mb-4">
              <Button variant={briefingType === "shift_handoff" ? "default" : "outline"} size="sm" onClick={() => setBriefingType("shift_handoff")}>Shift Handoff</Button>
              <Button variant={briefingType === "morning" ? "default" : "outline"} size="sm" onClick={() => setBriefingType("morning")}>Morning Briefing</Button>
            </div>
            <Button onClick={generate}>
              <Sparkles className="w-4 h-4 mr-2" />Generate Briefing
            </Button>
          </div>
        )}

        {loading && (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 text-indigo-400 mx-auto mb-3 animate-spin" />
            <p className="text-sm text-muted-foreground">Gathering data and generating briefing...</p>
          </div>
        )}

        {briefing && !loading && (
          <div className="space-y-4">
            <Badge className="bg-indigo-100 text-indigo-700" variant="secondary">
              <Sparkles className="w-3 h-3 mr-1" />AI-Generated — Review Required
            </Badge>

            {briefing.briefing_data && (
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-muted/50 rounded p-2 text-center">
                  <p className="text-lg font-bold">{briefing.briefing_data.new_cases}</p>
                  <p className="text-xs text-muted-foreground">New Cases</p>
                </div>
                <div className="bg-muted/50 rounded p-2 text-center">
                  <p className="text-lg font-bold">{briefing.briefing_data.released_cases}</p>
                  <p className="text-xs text-muted-foreground">Released</p>
                </div>
                <div className="bg-muted/50 rounded p-2 text-center">
                  <p className="text-lg font-bold text-red-600">{briefing.briefing_data.overdue_tasks?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Overdue Tasks</p>
                </div>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Briefing</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{briefing.briefing_text}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {briefing && !loading && (
            <>
              <Button variant="outline" onClick={handlePrint} size="sm">
                <Printer className="w-4 h-4 mr-2" />Print
              </Button>
              <Button onClick={() => onOpenChange?.(false)} size="sm">
                <Save className="w-4 h-4 mr-2" />Save & Close
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}