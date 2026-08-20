export type Status = "healthy" | "warning" | "critical" | "offline";
export type Severity = "Critical" | "High" | "Medium" | "Low";
export type Env = "Production" | "UAT" | "Dev";

export interface Application {
  id: string;
  name: string;
  owner: string;
  env: Env;
  criticality: Severity;
  deployment: string;
  serverId: string;
  status: Status;
}

export interface Server {
  id: string;
  name: string;
  hostname: string;
  ip: string;
  os: string;
  cpu: number;
  ram: number;
  storage: number;
  status: Status;
  rackId: string;
  slot: number;
}

export interface Rack {
  id: string;
  name: string;
  dc: string;
  capacity: number;
  temperature: number;
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: "Open" | "Investigating" | "Resolved";
  serverId: string;
  createdAt: string;
  downtimeMin: number;
  notes: string;
}

export const dataCenters = ["DC-East-01", "DC-West-02", "DC-EU-Frankfurt"];

export const racks: Rack[] = [
  { id: "RK-01", name: "Rack A1", dc: "DC-East-01", capacity: 42, temperature: 22.4 },
  { id: "RK-02", name: "Rack A2", dc: "DC-East-01", capacity: 42, temperature: 24.1 },
  { id: "RK-03", name: "Rack B1", dc: "DC-West-02", capacity: 42, temperature: 26.8 },
  { id: "RK-04", name: "Rack B2", dc: "DC-West-02", capacity: 42, temperature: 28.9 },
  { id: "RK-05", name: "Rack C1", dc: "DC-EU-Frankfurt", capacity: 42, temperature: 21.7 },
  { id: "RK-06", name: "Rack C2", dc: "DC-EU-Frankfurt", capacity: 42, temperature: 23.2 },
];

const osTypes = ["Ubuntu 22.04", "RHEL 9", "Windows Server 2022", "Debian 12", "Rocky Linux 9"];
const statuses: Status[] = ["healthy", "healthy", "healthy", "warning", "critical", "offline"];

export const servers: Server[] = Array.from({ length: 36 }, (_, i) => {
  const rack = racks[i % racks.length];
  return {
    id: `SRV-${String(i + 1).padStart(3, "0")}`,
    name: `srv-node-${i + 1}`,
    hostname: `node${i + 1}.app2rack.io`,
    ip: `10.0.${Math.floor(i / 6) + 1}.${(i % 6) + 10}`,
    os: osTypes[i % osTypes.length],
    cpu: 20 + ((i * 7) % 75),
    ram: 30 + ((i * 11) % 65),
    storage: 25 + ((i * 13) % 70),
    status: statuses[(i * 3) % statuses.length],
    rackId: rack.id,
    slot: (i % 14) + 1,
  };
});

const teams = ["Payments", "Identity", "Platform", "Data", "Web", "Mobile", "DevOps", "Analytics"];
const deployments = ["Kubernetes", "Docker", "Bare Metal", "VM"];
const envs: Env[] = ["Production", "UAT", "Dev"];
const crits: Severity[] = ["Critical", "High", "Medium", "Low"];

export const applications: Application[] = Array.from({ length: 24 }, (_, i) => ({
  id: `APP-${String(i + 1).padStart(3, "0")}`,
  name: ["Atlas", "Helios", "Orion", "Vega", "Nimbus", "Quasar", "Pulsar", "Nova", "Lumen", "Cipher", "Echo", "Forge"][i % 12] + " " + ["API", "Service", "Gateway", "Worker"][i % 4],
  owner: teams[i % teams.length],
  env: envs[i % 3],
  criticality: crits[i % 4],
  deployment: deployments[i % 4],
  serverId: servers[i % servers.length].id,
  status: statuses[(i * 5) % statuses.length],
}));

export const incidents: Incident[] = [
  { id: "INC-1042", title: "High CPU on srv-node-7", severity: "Critical", status: "Investigating", serverId: "SRV-007", createdAt: "2026-05-23T14:22:00Z", downtimeMin: 12, notes: "CPU sustained >95% for 8 minutes. Investigating runaway query." },
  { id: "INC-1041", title: "Rack B2 temperature spike", severity: "High", status: "Open", serverId: "SRV-016", createdAt: "2026-05-23T11:08:00Z", downtimeMin: 0, notes: "Temp at 29°C. HVAC team paged." },
  { id: "INC-1040", title: "Atlas API 5xx error rate", severity: "High", status: "Resolved", serverId: "SRV-001", createdAt: "2026-05-22T19:45:00Z", downtimeMin: 7, notes: "Rolled back to v4.2.1." },
  { id: "INC-1039", title: "RAM saturation on node-12", severity: "Medium", status: "Resolved", serverId: "SRV-012", createdAt: "2026-05-22T08:30:00Z", downtimeMin: 0, notes: "Memory leak patched." },
  { id: "INC-1038", title: "Disk usage warning", severity: "Low", status: "Resolved", serverId: "SRV-022", createdAt: "2026-05-21T16:12:00Z", downtimeMin: 0, notes: "Old logs purged." },
  { id: "INC-1037", title: "Network latency DC-West-02", severity: "Critical", status: "Resolved", serverId: "SRV-015", createdAt: "2026-05-20T09:00:00Z", downtimeMin: 34, notes: "ISP routing fix." },
  { id: "INC-1036", title: "Kubernetes pod crashloop on Helios Worker", severity: "High", status: "Investigating", serverId: "SRV-009", createdAt: "2026-05-19T22:15:00Z", downtimeMin: 18, notes: "OOMKilled 6 times in 10min. Increasing memory limits and reviewing recent deploy." },
  { id: "INC-1035", title: "SSL certificate expiring on gateway", severity: "Medium", status: "Open", serverId: "SRV-003", createdAt: "2026-05-19T13:40:00Z", downtimeMin: 0, notes: "Cert expires in 5 days. Renewal via Let's Encrypt scheduled." },
  { id: "INC-1034", title: "Database replication lag on Orion DB", severity: "High", status: "Investigating", serverId: "SRV-020", createdAt: "2026-05-19T06:55:00Z", downtimeMin: 0, notes: "Replica 90s behind primary. Investigating long-running write transaction." },
  { id: "INC-1033", title: "Backup job failed for Vega Service", severity: "Medium", status: "Resolved", serverId: "SRV-014", createdAt: "2026-05-18T02:10:00Z", downtimeMin: 0, notes: "S3 bucket permissions restored; nightly backup re-ran successfully." },
  { id: "INC-1032", title: "DDoS traffic spike on Nimbus Gateway", severity: "Critical", status: "Resolved", serverId: "SRV-005", createdAt: "2026-05-17T20:33:00Z", downtimeMin: 22, notes: "150k rps from botnet. Cloudflare WAF rule deployed." },
  { id: "INC-1031", title: "Storage volume degraded on Rack A2", severity: "High", status: "Investigating", serverId: "SRV-008", createdAt: "2026-05-17T15:05:00Z", downtimeMin: 0, notes: "RAID rebuild in progress after disk 3 failure. Hot spare engaged." },
  { id: "INC-1030", title: "Auth service 401 spike", severity: "Critical", status: "Resolved", serverId: "SRV-002", createdAt: "2026-05-16T09:20:00Z", downtimeMin: 15, notes: "Expired signing key. Rotated JWT keys and forced session refresh." },
  { id: "INC-1029", title: "Cache miss rate elevated on Quasar API", severity: "Low", status: "Open", serverId: "SRV-018", createdAt: "2026-05-15T17:48:00Z", downtimeMin: 0, notes: "Redis eviction rate up 3x since deploy. Reviewing TTL configuration." },
  { id: "INC-1028", title: "Power redundancy alert DC-EU-Frankfurt", severity: "Medium", status: "Resolved", serverId: "SRV-025", createdAt: "2026-05-15T04:12:00Z", downtimeMin: 0, notes: "PDU-B failover triggered. Utility power restored within 4 minutes." },
  { id: "INC-1027", title: "Cron job stuck on Pulsar Worker", severity: "Low", status: "Resolved", serverId: "SRV-011", createdAt: "2026-05-14T11:00:00Z", downtimeMin: 0, notes: "Nightly report job hung on DB lock. Killed and rescheduled." },
  { id: "INC-1026", title: "Firewall rule misconfiguration", severity: "High", status: "Resolved", serverId: "SRV-006", createdAt: "2026-05-13T14:27:00Z", downtimeMin: 9, notes: "Blocked internal service-to-service traffic. Rule reverted." },
];

export const incidentTrend = [
  { day: "Mon", critical: 1, high: 2, medium: 3, low: 4 },
  { day: "Tue", critical: 0, high: 1, medium: 2, low: 3 },
  { day: "Wed", critical: 2, high: 3, medium: 1, low: 2 },
  { day: "Thu", critical: 1, high: 2, medium: 4, low: 1 },
  { day: "Fri", critical: 0, high: 1, medium: 2, low: 5 },
  { day: "Sat", critical: 1, high: 0, medium: 1, low: 2 },
  { day: "Sun", critical: 2, high: 2, medium: 3, low: 3 },
];

export const utilizationTrend = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  cpu: 40 + Math.round(20 * Math.sin(i / 3) + (i % 5) * 3),
  ram: 50 + Math.round(15 * Math.cos(i / 4) + (i % 4) * 2),
  network: 30 + Math.round(25 * Math.sin(i / 2)),
}));
