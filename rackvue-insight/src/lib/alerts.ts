import { servers, racks, incidents, type Server, type Rack, type Incident } from "./mock-data";
import { AlertTriangle, Cpu, Thermometer, ServerCrash, type LucideIcon } from "lucide-react";

export type AlertKind = "downtime" | "cpu" | "heat" | "incident";
export type AlertLevel = "critical" | "warning" | "info";

export interface Alert {
  id: string;
  kind: AlertKind;
  level: AlertLevel;
  title: string;
  description: string;
  source: string;
  time: string;
  icon: LucideIcon;
}

function ago(): string {
  const mins = Math.floor(Math.random() * 55) + 1;
  return `${mins}m ago`;
}

export function buildAlerts(): Alert[] {
  const list: Alert[] = [];

  servers
    .filter((s: Server) => s.status === "offline")
    .forEach((s) => {
      list.push({
        id: `AL-DOWN-${s.id}`,
        kind: "downtime",
        level: "critical",
        title: `${s.name} is offline`,
        description: `Server ${s.hostname} (${s.ip}) stopped responding to health checks.`,
        source: s.id,
        time: ago(),
        icon: ServerCrash,
      });
    });

  servers
    .filter((s: Server) => s.cpu >= 85)
    .forEach((s) => {
      list.push({
        id: `AL-CPU-${s.id}`,
        kind: "cpu",
        level: s.cpu >= 92 ? "critical" : "warning",
        title: `High CPU on ${s.name}`,
        description: `CPU sustained at ${s.cpu}% — investigate runaway workloads.`,
        source: s.id,
        time: ago(),
        icon: Cpu,
      });
    });

  racks
    .filter((r: Rack) => r.temperature >= 26)
    .forEach((r) => {
      list.push({
        id: `AL-HEAT-${r.id}`,
        kind: "heat",
        level: r.temperature >= 28 ? "critical" : "warning",
        title: `${r.name} overheating`,
        description: `Rack temperature at ${r.temperature.toFixed(1)}°C in ${r.dc}. HVAC review required.`,
        source: r.id,
        time: ago(),
        icon: Thermometer,
      });
    });

  incidents
    .filter((i: Incident) => i.severity === "Critical" && i.status !== "Resolved")
    .forEach((i) => {
      list.push({
        id: `AL-INC-${i.id}`,
        kind: "incident",
        level: "critical",
        title: i.title,
        description: `${i.id} · ${i.status} · ${i.downtimeMin}m downtime`,
        source: i.serverId,
        time: ago(),
        icon: AlertTriangle,
      });
    });

  return list;
}

export const alerts = buildAlerts();

export const levelStyles: Record<
  AlertLevel,
  { text: string; bg: string; border: string; dot: string }
> = {
  critical: {
    text: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/40",
    dot: "bg-destructive",
  },
  warning: {
    text: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/40",
    dot: "bg-warning",
  },
  info: { text: "text-info", bg: "bg-info/10", border: "border-info/40", dot: "bg-info" },
};
