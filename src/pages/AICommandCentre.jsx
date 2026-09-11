import React, { useState, useEffect } from "react";
import { Sparkles, Brain, AlertTriangle, Clock, CheckCircle2, XCircle, Activity, TrendingUp, Building2, RefreshCw, FileText, Users, Package, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLocation } from "@/lib/LocationContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import HospitalBadge from "@/components/HospitalBadge";
import AITaskCard from "@/components/ai/AITaskCard";
import AIAlertBanner from "@/components/ai/AIAlertBanner";
import ShiftBriefingModal from "@/components/ai/ShiftBriefingModal";
import { HOSPITAL_LIST, HOSPITALS } from "@/lib/hospitals";

export default function AICommandCentre() {
  const { selectedLocation } = useLocation();
  const [loading, setLoading] = useState(true);
  const [engineRunning, setEngineRunning] = useState(false);
  const [data, setData] = useState({ decedents: [], tasks: [], alerts: [], releases: [], transfers: [], storageUnits: [] });
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [decedents, tasks, alerts, releases, transfers, storageUnits] = await Promise.all([
        base44.entities.Decedent.list("-created_date", 200),
        base44.entities.AITask.list("-created_date", 200),
        base44.entities.AIAlert.filter({ status: "active" }),
        base44.entities.Release.list("-created_date", 100),
        base44.entities.HospitalTransfer.list("-created_date", 50),
        base44.entities.StorageUnit.list("-created_date", 100),
      ]);
      setData({ decedents, tasks, alerts, releases, transfers, storageUnits });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedLocation]);

  const runEngine = async () => {
    setEngineRunning(true);
    try {
      await base44.functions.invoke("aiWorkflowEngine", { hospital_location: selectedLocation === "all" ? null : selectedLocation });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setEngineRunning(false);
    }
  };

  // Filter by hospital
  const filterByHospital = (items) => {
    if (selectedLocation === "all") return items;
    return items.filter((item) => item.hospital_location === selectedLocation);
  };

  const decedents = filterByHospital(data.decedents);
  const tasks = filterByHospital(data.tasks);
  const alerts = filterByHospital(data.alerts);
  const releases = filterByHospital(data.releases);
  const transfers = filterByHospital(data.transfers);
  const storageUnits = filterByHospital(data.storageUnits);

  // Compute metrics
  const activeCases = decedents.filter((d) => d.status !== "released");
  const newAdmissions = decedents.filter((d) => {
    const created = new Date(d.created_date);
    return (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24) < 1;
  });
  const coronerCases = decedents.filter((d) => ["homicide", "suicide", "accident"].includes(d.manner_of_death));
  const donationCases = decedents.filter((d) => d.is_donor === "yes");
  const overdueTasks = tasks.filter((t) => t.due_datetime && new Date(t.due_datetime) < new Date() && !["completed", "cancelled"].includes(t.status));
  const pendingTransfers = transfers.filter((t) => t.status === "pending" || t.status === "in_transit");
  const occupiedUnits = storageUnits.filter((u) => u.status === "occupied").length;
  const capacityPct = storageUnits.length > 0 ? Math.round((occupiedUnits / storageUnits.length) * 100) : 0;

  const criticalAlerts = alerts.filter((a) => a.alert_level === "critical");
  const urgentAlerts = alerts.filter((a) => a.alert_level === "urgent");

  // Group by hospital for the all-locations view
  const hospitalStats = HOSPITAL_LIST.map((h) => {
    const hDecedents = data.decedents.filter((d) => d.hospital_location === h.id);
    const hTasks = data.tasks.filter((t) => t.hospital_location === h.id);
    const hAlerts = data.alerts.filter((a) => a.hospital_location === h.id);
    return {
      hospital: h,
      activeCases: hDecedents.filter((d) => d.status !== "released").length,
      overdueTasks: hTasks.filter((t) => t.due_datetime && new Date(t.due_datetime) < new Date() && !["completed", "cancelled"].includes(t.status)).length,
      alerts: hAlerts.length,
    };
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-purple-500" />
            <h1 className="text-2xl font-bold">Custiviant AI Command Centre</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Intelligent workflow monitoring across {selectedLocation === "all" ? "all hospitals" : HOSPITALS.find((h) => h.id === selectedLocation)?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setBriefingOpen(true)} size="sm">
            <FileText className="w-4 h-4 mr-2" />Generate Shift Briefing
          </Button>
          <Button onClick={runEngine} disabled={engineRunning} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${engineRunning ? "animate-spin" : ""}`} />
            {engineRunning ? "Running AI Engine..." : "Run AI Workflow Engine"}
          </Button>
        </div>
      </div>

      {/* Hospital Comparison Cards */}
      {selectedLocation === "all" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hospitalStats.map(({ hospital, activeCases, overdueTasks, alerts }) => (
            <Card key={hospital.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <HospitalBadge hospitalId={hospital.id} size="sm" showIcon />
                {alerts > 0 && <Badge className="bg-red-100 text-red-700" variant="secondary">{alerts} alerts</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-bold">{activeCases}</p>
                  <p className="text-xs text-muted-foreground">Active Cases</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${overdueTasks > 0 ? "text-red-600" : ""}`}>{overdueTasks}</p>
                  <p className="text-xs text-muted-foreground">Overdue Tasks</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Active Cases", value: activeCases.length, icon: Users, color: "text-blue-500" },
          { label: "New (24h)", value: newAdmissions.length, icon: TrendingUp, color: "text-green-500" },
          { label: "Coroner Cases", value: coronerCases.length, icon: Shield, color: "text-red-500" },
          { label: "Donation Cases", value: donationCases.length, icon: Package, color: "text-purple-500" },
          { label: "Overdue Tasks", value: overdueTasks.length, icon: Clock, color: "text-amber-500" },
          { label: "Capacity", value: `${capacityPct}%`, icon: Building2, color: capacityPct > 85 ? "text-red-500" : "text-green-500" },
        ].map((metric) => (
          <Card key={metric.label} className="p-3">
            <metric.icon className={`w-4 h-4 mb-2 ${metric.color}`} />
            <p className="text-2xl font-bold">{metric.value}</p>
            <p className="text-xs text-muted-foreground">{metric.label}</p>
          </Card>
        ))}
      </div>

      {/* High-Priority Alerts */}
      {alerts.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold">Active Alerts ({alerts.length})</h2>
          </div>
          <AIAlertBanner alerts={alerts.slice(0, 5)} />
        </Card>
      )}

      {/* Overdue & Priority Tasks */}
      {tasks.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold">Priority Tasks</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks
              .filter((t) => !["completed", "cancelled"].includes(t.status))
              .sort((a, b) => {
                const order = { critical: 0, high: 1, medium: 2, low: 3 };
                return order[a.priority] - order[b.priority];
              })
              .slice(0, 6)
              .map((task) => (
                <AITaskCard key={task.id} task={task} compact />
              ))}
          </div>
        </Card>
      )}

      {/* Transfers & Capacity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-cyan-500" />
            <h2 className="text-sm font-semibold">Inter-Hospital Transfers ({pendingTransfers.length})</h2>
          </div>
          {pendingTransfers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No pending transfers.</p>
          ) : (
            <div className="space-y-2">
              {pendingTransfers.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-sm border-b pb-2 last:border-0">
                  <span className="font-mono text-xs">{t.decedent_unique_id}</span>
                  <HospitalBadge hospitalId={t.from_hospital} size="xs" />
                  <span className="text-muted-foreground">→</span>
                  <HospitalBadge hospitalId={t.to_hospital} size="xs" />
                  <Badge className="bg-amber-100 text-amber-700 ml-auto" variant="secondary">{t.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold">Storage Capacity</h2>
          </div>
          <div className="space-y-2">
            {HOSPITAL_LIST.filter((h) => selectedLocation === "all" || h.id === selectedLocation).map((h) => {
              const hUnits = data.storageUnits.filter((u) => u.hospital_location === h.id);
              const hOccupied = hUnits.filter((u) => u.status === "occupied").length;
              const hPct = hUnits.length > 0 ? Math.round((hOccupied / hUnits.length) * 100) : 0;
              return (
                <div key={h.id} className="flex items-center gap-3">
                  <HospitalBadge hospitalId={h.id} size="xs" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${hPct > 85 ? "bg-red-500" : hPct > 60 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${hPct}%` }} />
                  </div>
                  <span className="text-xs font-mono w-16 text-right">{hOccupied}/{hUnits.length}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <ShiftBriefingModal hospitalLocation={selectedLocation} open={briefingOpen} onOpenChange={setBriefingOpen} />
    </div>
  );
}