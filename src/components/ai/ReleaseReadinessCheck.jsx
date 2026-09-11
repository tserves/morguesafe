import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function ReleaseReadinessCheck({ decedentId, decedentUniqueId, onResult }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runCheck = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("checkReleaseReadiness", { decedent_id: decedentId });
      setResult(res.data);
      onResult?.(res.data);
    } catch (err) {
      setResult({ readiness_status: "not_ready", blockers: [err.message], warnings: [], checks: [] });
    } finally {
      setLoading(false);
    }
  };

  const STATUS_CONFIG = {
    ready: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", label: "Ready for Release" },
    conditionally_ready: { icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Conditionally Ready" },
    not_ready: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Not Ready" },
  };

  if (!result && !loading) {
    return (
      <Button onClick={runCheck} variant="outline" className="w-full">
        <ShieldCheck className="w-4 h-4 mr-2" />Run Release Readiness Check
      </Button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking release readiness...
      </div>
    );
  }

  const config = STATUS_CONFIG[result.readiness_status] || STATUS_CONFIG.not_ready;
  const Icon = config.icon;

  return (
    <div className={cn("rounded-lg border p-4", config.bg, config.border)}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn("w-5 h-5", config.color)} />
        <span className={cn("font-semibold", config.color)}>{config.label}</span>
        {result.unique_id && <span className="text-xs font-mono text-muted-foreground ml-auto">{result.unique_id}</span>}
      </div>

      {result.checks && result.checks.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {result.checks.map((check, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              {check.passed ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              ) : check.isBlocker ? (
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span className={check.passed ? "text-foreground" : "text-muted-foreground"}>{check.label}</span>
            </div>
          ))}
        </div>
      )}

      {result.blockers && result.blockers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <p className="text-xs font-semibold text-red-700 mb-1">Blockers:</p>
          <ul className="text-xs text-red-600 space-y-0.5">
            {result.blockers.map((b, i) => <li key={i}>• {b}</li>)}
          </ul>
        </div>
      )}

      {result.warnings && result.warnings.length > 0 && (
        <div className="mt-3 pt-3 border-t border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-1">Warnings:</p>
          <ul className="text-xs text-amber-600 space-y-0.5">
            {result.warnings.map((w, i) => <li key={i}>• {w}</li>)}
          </ul>
        </div>
      )}

      <Button onClick={runCheck} variant="ghost" size="sm" className="mt-3 w-full text-xs">
        Re-run check
      </Button>
    </div>
  );
}