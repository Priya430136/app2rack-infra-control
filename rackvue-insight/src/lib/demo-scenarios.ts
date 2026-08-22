import type { RackRow, ServerRow, ApplicationRow } from "@/lib/infra.functions";

type IncidentRow = {
  id: string;
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "Investigating" | "Mitigating" | "Resolved";
  server_id: string;
  created_at: string;
  updated_at: string;
  downtime_min: number;
  notes: string | null;
  archived_at: string | null;
  user_id: string;
};

export type ScenarioDataset = {
  racks: RackRow[];
  servers: ServerRow[];
  applications: ApplicationRow[];
  incidents: { incidents: IncidentRow[] };
};

export type ScenarioTone = "healthy" | "warning" | "critical" | "info";

export type ScenarioDef = {
  id: string;
  name: string;
  tagline: string;
  narrative: string;
  tone: ScenarioTone;
  build: () => ScenarioDataset;
};

const DEMO_USER = "demo-user";
const now = () => new Date().toISOString();
const uid = (p: string, i: number) => `${p}-${i.toString().padStart(3, "0")}`;
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const DCS = ["DC-East-01", "DC-East-02", "DC-West-01", "DC-EU-Frankfurt"] as const;

function baseRacks(temps: Partial<Record<string, number>> = {}): RackRow[] {
  return DCS.flatMap((dc, di) =>
    Array.from({ length: 3 }).map((_, ri) => {
      const id = uid(`rack-${di}-${ri}`, ri);
      return {
        id,
        name: `${dc.split("-").slice(1).join("-")}-R${ri + 1}`,
        dc,
        capacity_u: 42,
        temperature_c: temps[id] ?? 21 + Math.round(Math.random() * 4),
        archived_at: null,
        created_at: now(),
        updated_at: now(),
        user_id: DEMO_USER,
      } satisfies RackRow;
    }),
  );
}

function buildServers(
  racks: RackRow[],
  opts: {
    perRack?: number;
    load: (server: {
      rackIndex: number;
      slot: number;
      dc: string;
    }) => Pick<ServerRow, "cpu" | "ram" | "storage" | "status">;
  },
): ServerRow[] {
  const perRack = opts.perRack ?? 8;
  const oses = ["Ubuntu 22.04", "RHEL 9", "Debian 12", "Windows Server 2022"];
  return racks.flatMap((rack, rackIndex) =>
    Array.from({ length: perRack }).map((_, slot) => {
      const id = uid(`srv-${rack.id}`, slot);
      const dc = rack.dc;
      const load = opts.load({ rackIndex, slot, dc });
      return {
        id,
        name: `${rack.name}-S${slot + 1}`,
        hostname: `${rack.name.toLowerCase()}-s${slot + 1}.corp`,
        ip: `10.${rackIndex + 10}.${slot + 1}.${100 + slot}`,
        os: oses[(rackIndex + slot) % oses.length],
        cpu: load.cpu,
        ram: load.ram,
        storage: load.storage,
        status: load.status,
        rack_id: rack.id,
        slot: slot + 1,
        archived_at: null,
        created_at: now(),
        updated_at: now(),
        user_id: DEMO_USER,
      } satisfies ServerRow;
    }),
  );
}

const APP_NAMES = [
  "checkout-api",
  "auth-service",
  "orders-svc",
  "search-api",
  "inventory-db",
  "billing-gw",
  "notification-hub",
  "analytics-etl",
  "recommendation-ml",
  "cdn-edge",
  "media-encoder",
  "session-store",
  "audit-pipeline",
  "risk-scoring",
  "cart-service",
  "shipping-router",
  "fraud-detector",
  "loyalty-engine",
];

function buildApplications(
  servers: ServerRow[],
  perServerBias = 0.7,
  criticalityBias: "high" | "mixed" = "mixed",
): ApplicationRow[] {
  const envs: Array<"Production" | "UAT" | "Dev"> = ["Production", "UAT", "Dev"];
  return APP_NAMES.map((name, i) => {
    const server = servers[Math.floor(i * perServerBias) % servers.length];
    const env = envs[i % 3];
    const crit: ApplicationRow["criticality"] =
      criticalityBias === "high"
        ? (["Critical", "Critical", "High", "High", "Medium"] as const)[i % 5]
        : (["Critical", "High", "Medium", "Medium", "Low"] as const)[i % 5];
    return {
      id: uid("app", i),
      name,
      owner: ["Platform", "Payments", "Growth", "Data", "SRE"][i % 5],
      env,
      criticality: crit,
      deployment: ["Kubernetes", "ECS", "Bare-metal", "Lambda"][i % 4],
      status: server.status,
      server_id: server.id,
      archived_at: null,
      created_at: now(),
      updated_at: now(),
      user_id: DEMO_USER,
    } satisfies ApplicationRow;
  });
}

function pickIncidents(
  servers: ServerRow[],
  specs: Array<{
    title: string;
    severity: IncidentRow["severity"];
    status: IncidentRow["status"];
    minsAgo: number;
    downtime: number;
    notes?: string;
    match?: (s: ServerRow) => boolean;
  }>,
): IncidentRow[] {
  return specs.map((spec, i) => {
    const pool = spec.match ? servers.filter(spec.match) : servers;
    const server = pool[i % Math.max(1, pool.length)] ?? servers[0];
    return {
      id: uid("inc", i),
      title: spec.title,
      severity: spec.severity,
      status: spec.status,
      server_id: server?.id ?? "n/a",
      created_at: minsAgo(spec.minsAgo),
      updated_at: minsAgo(Math.max(0, spec.minsAgo - 5)),
      downtime_min: spec.downtime,
      notes: spec.notes ?? null,
      archived_at: null,
      user_id: DEMO_USER,
    };
  });
}

// ── Scenarios ───────────────────────────────────────────────────────────────

export const SCENARIOS: ScenarioDef[] = [
  {
    id: "nominal",
    name: "Nominal operations",
    tagline: "Steady state · fleet green",
    narrative: "Baseline traffic across all data centers. CPU 35–55%, no active incidents.",
    tone: "healthy",
    build: () => {
      const racks = baseRacks();
      const servers = buildServers(racks, {
        load: () => ({
          cpu: 30 + Math.round(Math.random() * 25),
          ram: 40 + Math.round(Math.random() * 25),
          storage: 45 + Math.round(Math.random() * 20),
          status: "healthy",
        }),
      });
      const applications = buildApplications(servers, 0.7, "mixed");
      const incidents = pickIncidents(servers, [
        {
          title: "Log ingestion lag > 90s",
          severity: "Low",
          status: "Resolved",
          minsAgo: 320,
          downtime: 12,
        },
        {
          title: "Cert renewal warning · auth-service",
          severity: "Medium",
          status: "Resolved",
          minsAgo: 180,
          downtime: 0,
        },
      ]);
      return { racks, servers, applications, incidents: { incidents } };
    },
  },
  {
    id: "cascading-outage",
    name: "Cascading DC outage",
    tagline: "DC-East-01 network partition",
    narrative: "Top-of-rack switch failure took the primary AZ offline. Failover in progress.",
    tone: "critical",
    build: () => {
      const racks = baseRacks({ "rack-0-0-000": 32, "rack-0-1-001": 30 });
      const servers = buildServers(racks, {
        load: ({ dc, slot }) => {
          if (dc === "DC-East-01") {
            const offline = slot < 5;
            return {
              cpu: offline ? 0 : 88 + Math.round(Math.random() * 10),
              ram: offline ? 0 : 82 + Math.round(Math.random() * 12),
              storage: 55 + Math.round(Math.random() * 20),
              status: offline ? "offline" : "critical",
            };
          }
          if (dc === "DC-East-02") {
            return {
              cpu: 75 + Math.round(Math.random() * 15),
              ram: 70 + Math.round(Math.random() * 15),
              storage: 60 + Math.round(Math.random() * 15),
              status: slot % 3 === 0 ? "warning" : "healthy",
            };
          }
          return {
            cpu: 40 + Math.round(Math.random() * 20),
            ram: 45 + Math.round(Math.random() * 20),
            storage: 50 + Math.round(Math.random() * 15),
            status: "healthy",
          };
        },
      });
      const applications = buildApplications(servers, 0.7, "high");
      const incidents = pickIncidents(servers, [
        {
          title: "TOR switch failure · East-01-R1",
          severity: "Critical",
          status: "Mitigating",
          minsAgo: 14,
          downtime: 14,
          notes: "BGP routes withdrawn. Rerouting via East-02.",
          match: (s) => s.status === "offline",
        },
        {
          title: "checkout-api p99 latency > 4s",
          severity: "Critical",
          status: "Investigating",
          minsAgo: 12,
          downtime: 12,
          match: (s) => s.status === "critical",
        },
        {
          title: "auth-service 5xx rate 18%",
          severity: "High",
          status: "Investigating",
          minsAgo: 11,
          downtime: 11,
          match: (s) => s.status === "critical",
        },
        {
          title: "orders-svc queue backlog 42k msgs",
          severity: "High",
          status: "Open",
          minsAgo: 9,
          downtime: 9,
          match: (s) => s.status === "critical",
        },
        {
          title: "Cross-AZ replication lag > 60s",
          severity: "Medium",
          status: "Investigating",
          minsAgo: 7,
          downtime: 0,
        },
        {
          title: "Cache hit rate dropped 22%",
          severity: "Medium",
          status: "Open",
          minsAgo: 5,
          downtime: 0,
        },
      ]);
      return { racks, servers, applications, incidents: { incidents } };
    },
  },
  {
    id: "peak-load",
    name: "Peak load surge",
    tagline: "Black Friday · 8× baseline traffic",
    narrative: "All web tiers running hot. Autoscalers at ceiling. Watch checkout latency.",
    tone: "warning",
    build: () => {
      const racks = baseRacks();
      const servers = buildServers(racks, {
        load: ({ slot }) => {
          const cpu = 78 + Math.round(Math.random() * 18);
          const ram = 80 + Math.round(Math.random() * 15);
          return {
            cpu,
            ram,
            storage: 68 + Math.round(Math.random() * 18),
            status:
              cpu > 92 ? "critical" : cpu > 85 ? "warning" : slot % 5 === 0 ? "warning" : "healthy",
          };
        },
      });
      const applications = buildApplications(servers, 0.7, "high");
      const incidents = pickIncidents(servers, [
        {
          title: "checkout-api CPU throttling",
          severity: "High",
          status: "Mitigating",
          minsAgo: 22,
          downtime: 0,
          match: (s) => s.status === "warning",
        },
        {
          title: "search-api p95 latency 1.8s",
          severity: "Medium",
          status: "Investigating",
          minsAgo: 18,
          downtime: 0,
        },
        {
          title: "recommendation-ml OOM restarts (3)",
          severity: "Medium",
          status: "Open",
          minsAgo: 12,
          downtime: 6,
        },
        {
          title: "CDN origin shield saturation",
          severity: "Medium",
          status: "Mitigating",
          minsAgo: 8,
          downtime: 0,
        },
        {
          title: "session-store connection pool exhausted",
          severity: "High",
          status: "Open",
          minsAgo: 4,
          downtime: 0,
          match: (s) => s.status === "critical",
        },
      ]);
      return { racks, servers, applications, incidents: { incidents } };
    },
  },
  {
    id: "ransomware",
    name: "Ransomware containment",
    tagline: "Isolating lateral movement",
    narrative:
      "IDS flagged suspicious SMB traffic. Affected segments quarantined; forensics active.",
    tone: "critical",
    build: () => {
      const racks = baseRacks();
      const servers = buildServers(racks, {
        load: ({ rackIndex, slot }) => {
          const isolated = rackIndex === 2 && slot < 4;
          const compromised = rackIndex === 2 && slot >= 4 && slot < 6;
          if (isolated) return { cpu: 0, ram: 0, storage: 62, status: "offline" };
          if (compromised) return { cpu: 96, ram: 91, storage: 88, status: "critical" };
          return {
            cpu: 45 + Math.round(Math.random() * 20),
            ram: 50 + Math.round(Math.random() * 20),
            storage: 55 + Math.round(Math.random() * 15),
            status: rackIndex === 3 && slot % 4 === 0 ? "warning" : "healthy",
          };
        },
      });
      const applications = buildApplications(servers, 0.7, "high");
      const incidents = pickIncidents(servers, [
        {
          title: "IDS: encrypted SMB traffic from West-01-R3",
          severity: "Critical",
          status: "Investigating",
          minsAgo: 42,
          downtime: 0,
          match: (s) => s.status === "critical",
        },
        {
          title: "Quarantine: 4 hosts isolated from network",
          severity: "Critical",
          status: "Mitigating",
          minsAgo: 35,
          downtime: 35,
          match: (s) => s.status === "offline",
        },
        {
          title: "Unusual outbound to 185.220.x.x",
          severity: "High",
          status: "Investigating",
          minsAgo: 28,
          downtime: 0,
        },
        {
          title: "audit-pipeline: 12k anomalous auth events",
          severity: "High",
          status: "Open",
          minsAgo: 20,
          downtime: 0,
        },
        {
          title: "Backup restore validated (T-2h snapshot)",
          severity: "Medium",
          status: "Resolved",
          minsAgo: 10,
          downtime: 0,
        },
      ]);
      return { racks, servers, applications, incidents: { incidents } };
    },
  },
  {
    id: "capacity-crunch",
    name: "Capacity crunch",
    tagline: "94% rack utilization · runway 11 days",
    narrative: "Growth outpacing hardware refresh. Multiple racks over thermal target.",
    tone: "warning",
    build: () => {
      const racks = baseRacks({
        "rack-0-0-000": 28,
        "rack-0-1-001": 29,
        "rack-0-2-002": 27,
        "rack-1-0-000": 26,
        "rack-1-1-001": 28,
      });
      const servers = buildServers(racks, {
        perRack: 12,
        load: () => {
          const cpu = 62 + Math.round(Math.random() * 25);
          return {
            cpu,
            ram: 78 + Math.round(Math.random() * 18),
            storage: 88 + Math.round(Math.random() * 10),
            status: cpu > 82 ? "warning" : "healthy",
          };
        },
      });
      const applications = buildApplications(servers, 0.7, "mixed");
      const incidents = pickIncidents(servers, [
        {
          title: "Rack East-01-R1 at 33°C · above target",
          severity: "High",
          status: "Open",
          minsAgo: 55,
          downtime: 0,
        },
        {
          title: "Disk usage > 88% on 14 nodes",
          severity: "Medium",
          status: "Investigating",
          minsAgo: 40,
          downtime: 0,
        },
        {
          title: "PDU-A load at 92% (limit 95%)",
          severity: "Medium",
          status: "Open",
          minsAgo: 30,
          downtime: 0,
        },
        {
          title: "inventory-db WAL growth 3× normal",
          severity: "Medium",
          status: "Investigating",
          minsAgo: 18,
          downtime: 0,
        },
        {
          title: "Forecast: capacity runway 11 days",
          severity: "High",
          status: "Open",
          minsAgo: 5,
          downtime: 0,
        },
      ]);
      return { racks, servers, applications, incidents: { incidents } };
    },
  },
];

export function getScenario(id: string | null | undefined): ScenarioDef | null {
  if (!id) return null;
  return SCENARIOS.find((s) => s.id === id) ?? null;
}
