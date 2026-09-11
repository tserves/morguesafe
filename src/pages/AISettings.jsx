import React, { useState, useEffect } from "react";
import { Brain, ToggleLeft, ToggleRight, Save, Settings, AlertTriangle, Clock, Bell, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLocation } from "@/lib/LocationContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HospitalBadge from "@/components/HospitalBadge";
import DemoDataManagement from "@/components/DemoDataManagement";
import { HOSPITAL_LIST } from "@/lib/hospitals";

const FEATURES = [
  { key: "workflow_engine", label: "AI Workflow Engine", description: "Monitor cases and generate tasks/alerts automatically" },
  { key: "case_summary", label: "AI Case Summary", description: "Generate AI-powered case summaries on demand" },
  { key: "document_processing", label: "Document Processing", description: "AI-assisted document classification and extraction" },
  { key: "task_management", label: "Task Management", description: "Automated task creation and management" },
  { key: "smart_alerts", label: "Smart Alerts", description: "Configurable alerts and escalations" },
  { key: "release_readiness", label: "Release Readiness", description: "AI-powered release readiness checks" },
  { key: "shift_briefing", label: "Shift Briefing", description: "Generate AI shift handoff briefings" },
  { key: "conversational_assistant", label: "Conversational Assistant", description: "Chat-based AI assistant for operational queries" },
];

const THRESHOLDS = [
  { key: "stage_delay_hours", label: "Stage Delay (hours)", description: "Hours before a stage is flagged as delayed", default: 24 },
  { key: "prolonged_stay_days", label: "Prolonged Stay (days)", description: "Days before a case is flagged as prolonged", default: 7 },
  { key: "task_escalation_hours", label: "Task Escalation (hours)", description: "Hours before a task is auto-escalated", default: 48 },
  { key: "release_reminder_hours", label: "Release Reminder (hours)", description: "Hours before release to send reminder", default: 24 },
  { key: "transfer_acknowledgment_hours", label: "Transfer Acknowledgment (hours)", description: "Hours to acknowledge a transfer", default: 4 },
];

export default function AISettings() {
  const { selectedLocation } = useLocation();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testRunning, setTestRunning] = useState(false);

  const defaultSettings = {
    features: Object.fromEntries(FEATURES.map((f) => [f.key, true])),
    thresholds: Object.fromEntries(THRESHOLDS.map((t) => [t.key, t.default])),
    notification_preferences: { email_alerts: true, in_app_alerts: true, escalation_emails: true, daily_digest: false },
  };

  useEffect(() => {
    // Try to load existing settings, fall back to defaults
    const loadSettings = async () => {
      setLoading(true);
      try {
        const existing = await base44.entities.AISettings.filter({ hospital_location: selectedLocation === "all" ? "all" : selectedLocation });
        if (existing.length > 0) {
          setSettings(existing[0]);
        } else {
          setSettings({ hospital_location: selectedLocation === "all" ? "all" : selectedLocation, ...defaultSettings });
        }
      } catch {
        setSettings({ hospital_location: selectedLocation === "all" ? "all" : selectedLocation, ...defaultSettings });
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [selectedLocation]);

  const toggleFeature = (key) => {
    setSettings((prev) => ({ ...prev, features: { ...prev.features, [key]: !prev.features[key] } }));
  };

  const updateThreshold = (key, value) => {
    setSettings((prev) => ({ ...prev, thresholds: { ...prev.thresholds, [key]: Number(value) } }));
  };

  const toggleNotification = (key) => {
    setSettings((prev) => ({ ...prev, notification_preferences: { ...prev.notification_preferences, [key]: !prev.notification_preferences[key] } }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const me = await base44.auth.me();
      const data = {
        ...settings,
        hospital_location: selectedLocation === "all" ? "all" : selectedLocation,
        updated_by: me?.full_name || me?.email || "admin",
        updated_datetime: new Date().toISOString(),
      };
      if (settings.id) {
        await base44.entities.AISettings.update(settings.id, data);
      } else {
        const created = await base44.entities.AISettings.create(data);
        setSettings(created);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const testWorkflow = async () => {
    setTestRunning(true);
    try {
      await base44.functions.invoke("aiWorkflowEngine", { hospital_location: selectedLocation === "all" ? null : selectedLocation });
    } catch (err) {
      console.error(err);
    } finally {
      setTestRunning(false);
    }
  };

  if (loading || !settings) return <div className="p-6 text-muted-foreground">Loading settings...</div>;

  return (
    <div className="p-6 space-y-6 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-purple-500" />
            <h1 className="text-2xl font-bold">AI Workflow Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure AI features for {selectedLocation === "all" ? "all hospitals" : HOSPITAL_LIST.find((h) => h.id === selectedLocation)?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={testWorkflow} disabled={testRunning} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${testRunning ? "animate-spin" : ""}`} />
            {testRunning ? "Testing..." : "Test AI Workflow"}
          </Button>
          <Button onClick={save} disabled={saving} size="sm">
            <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Feature Toggles */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <ToggleLeft className="w-4 h-4" />AI Features
        </h2>
        <div className="space-y-3">
          {FEATURES.map((feature) => (
            <div key={feature.key} className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{feature.label}</Label>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
              <Switch checked={settings.features[feature.key]} onCheckedChange={() => toggleFeature(feature.key)} />
            </div>
          ))}
        </div>
      </Card>

      {/* Thresholds */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />Task & Escalation Thresholds
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {THRESHOLDS.map((threshold) => (
            <div key={threshold.key}>
              <Label className="text-sm font-medium">{threshold.label}</Label>
              <p className="text-xs text-muted-foreground mb-1">{threshold.description}</p>
              <Input
                type="number"
                value={settings.thresholds[threshold.key] ?? threshold.default}
                onChange={(e) => updateThreshold(threshold.key, e.target.value)}
                className="w-24"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4" />Notification Preferences
        </h2>
        <div className="space-y-3">
          {[
            { key: "email_alerts", label: "Email Alerts", description: "Send alerts via email" },
            { key: "in_app_alerts", label: "In-App Alerts", description: "Show alerts in the application" },
            { key: "escalation_emails", label: "Escalation Emails", description: "Email when tasks are escalated" },
            { key: "daily_digest", label: "Daily Digest", description: "Daily summary of all AI activity" },
          ].map((pref) => (
            <div key={pref.key} className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{pref.label}</Label>
                <p className="text-xs text-muted-foreground">{pref.description}</p>
              </div>
              <Switch checked={settings.notification_preferences[pref.key]} onCheckedChange={() => toggleNotification(pref.key)} />
            </div>
          ))}
        </div>
      </Card>

      {/* Demo Data Management */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />Demo Data Management
        </h2>
        <DemoDataManagement />
      </Card>
    </div>
  );
}