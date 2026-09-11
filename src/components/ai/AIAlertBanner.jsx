import React from "react";
import { AlertTriangle, Bell, Info, AlertCircle, XCircle, CheckCircle2, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const LEVEL_CONFIG = {
  informational: { icon: Info, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" },
  attention: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
  urgent: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
  critical: { icon: XCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
};

export default function AIAlertBanner({ alerts = [], onAcknowledge }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const config = LEVEL_CONFIG[alert.alert_level] || LEVEL_CONFIG.informational;
        const Icon = config.icon;
        return (
          <div key={alert.id} className={cn("flex items-start gap-3 p-3 rounded-lg border", config.bg, config.border)}>
            <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", config.color)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{alert.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
            </div>
            {onAcknowledge && (
              <button
                onClick={() => onAcknowledge(alert)}
                className="text-muted-foreground hover:text-foreground shrink-0"
                title="Acknowledge alert"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}