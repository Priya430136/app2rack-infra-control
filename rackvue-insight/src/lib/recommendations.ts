import type { RackRow, ServerRow, ApplicationRow } from "@/lib/infra.functions";

export type Recommendation = {
  id: string;
  level: "info" | "warning" | "critical";
  title: string;
  detail: string;
};

export function computeRecommendations({
  racks,
  servers,
  applications,
}: {
  racks: RackRow[];
  servers: ServerRow[];
  applications: ApplicationRow[];
}): Recommendation[] {
  const out: Recommendation[] = [];
  if (servers.length === 0) {
    out.push({
      id: "no-data",
      level: "info",
      title: "No infrastructure data yet",
      detail: "Seed demo data or import a dataset to unlock recommendations.",
    });
    return out;
  }

  // Storage projection
  const avgStorage = servers.reduce((s, x) => s + x.storage, 0) / servers.length;
  if (avgStorage >= 80) {
    out.push({
      id: "storage-high",
      level: "critical",
      title: `Storage is averaging ${avgStorage.toFixed(0)}% across the fleet`,
      detail: "Provision additional storage, archive cold data, or enable tiered object storage.",
    });
  } else if (avgStorage >= 60) {
    const monthsTo90 = Math.max(1, Math.round((90 - avgStorage) / 4));
    out.push({
      id: "storage-trend",
      level: "warning",
      title: `Storage will reach 90% within ~${monthsTo90} months`,
      detail: "Plan a capacity expansion in the next quarter and review retention policies.",
    });
  }

  // Rack overload
  for (const r of racks) {
    const used = servers.filter((s) => s.rack_id === r.id).length;
    const util = used / Math.max(1, r.capacity_u);
    if (util > 0.85 || r.temperature_c > 27) {
      out.push({
        id: `rack-${r.id}`,
        level: util > 0.95 || r.temperature_c > 29 ? "critical" : "warning",
        title: `${r.name} is overloaded`,
        detail: `${used}/${r.capacity_u}U occupied · ${r.temperature_c}°C. Redistribute workloads or check cooling.`,
      });
    }
  }

  // CPU underutilization
  const avgCpu = servers.reduce((s, x) => s + x.cpu, 0) / servers.length;
  if (avgCpu < 25 && servers.length >= 5) {
    out.push({
      id: "cpu-underutilized",
      level: "info",
      title: "Servers are underutilized",
      detail: `Average CPU ${avgCpu.toFixed(0)}% across ${servers.length} servers. Consider consolidation for cost savings.`,
    });
  }

  // Critical incidents proxy: high count of critical-status servers
  const critCount = servers.filter((s) => s.status === "critical" || s.status === "offline").length;
  if (critCount > 0) {
    out.push({
      id: "critical-servers",
      level: critCount > 2 ? "critical" : "warning",
      title: `${critCount} server${critCount > 1 ? "s" : ""} in critical/offline state`,
      detail: "Investigate health checks; consider failover or replacement.",
    });
  }

  // Cloud cost heuristic
  const prodApps = applications.filter((a) => a.env === "Production").length;
  if (prodApps >= 10) {
    out.push({
      id: "cloud-cost",
      level: "info",
      title: "Cloud spend can be reduced ~18%",
      detail: `${prodApps} production apps detected. Right-sizing reservations and committed-use discounts typically reclaim 15–22%.`,
    });
  }

  return out.slice(0, 8);
}
