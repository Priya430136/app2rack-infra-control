import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { TopBar } from "@/components/app/topbar";
import { StatCard } from "@/components/app/stat-card";
import { SeverityBadge } from "@/components/app/status-badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Boxes,
  Server,
  AlertTriangle,
  Cpu,
  Activity,
  Upload,
  Sparkles,
  TerminalSquare,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { utilizationTrend, incidentTrend } from "@/lib/mock-data";
import { ExportMenu } from "@/components/app/export-menu";
import { EmptyState } from "@/components/app/empty-state";
import { RecommendationsCard } from "@/components/app/recommendations-card";
import { applicationsQO, serversQO, racksQO, metricsQO } from "@/lib/infra-queries";
import { getIncidents } from "@/lib/incidents.functions";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function buildIncidentTrend(incidents: { created_at?: string; severity?: string }[]) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      date: d.toISOString().slice(0, 10),
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
  });
  for (const inc of incidents) {
    const key = (inc.created_at ?? "").slice(0, 10);
    const bucket = days.find((d) => d.date === key);
    const sev = (inc.severity ?? "").toLowerCase() as "critical" | "high" | "medium" | "low";
    if (bucket && sev in bucket) bucket[sev]++;
  }
  return days;
}

function Dashboard() {
  const { user } = useCurrentUser();
  const apps = useQuery(applicationsQO);
  const serversQ = useQuery(serversQO);
  const racksQ = useQuery(racksQO);
  const metricsQ = useQuery(metricsQO);
  const fetchIncidents = useServerFn(getIncidents);
  const incidentsQ = useQuery({ queryKey: ["incidents"], queryFn: () => fetchIncidents() });

  const servers = serversQ.data ?? [];
  const racks = racksQ.data ?? [];
  const applications = apps.data ?? [];
  const incidents = incidentsQ.data?.incidents ?? [];
  const metrics = metricsQ.data ?? [];

  const fleetUtilization = metrics.length
    ? metrics.map((m: any) => ({
        hour: new Date(m.captured_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        cpu: m.cpu,
        ram: m.ram,
        network: m.network,
      }))
    : utilizationTrend;

  const incidentSeverityTrend = incidents.length ? buildIncidentTrend(incidents) : incidentTrend;

  if (!serversQ.isLoading && servers.length === 0 && racks.length === 0) {
    return (
      <>
        <TopBar
          title="Infrastructure Overview"
          subtitle="Real-time fleet health, utilization & incidents"
        />
        <div className="p-6">
          <EmptyState entity="infrastructure data" />
        </div>
      </>
    );
  }

  const activeInc = incidents.filter((i) => i.status !== "Resolved").length;
  const totalSlots = Math.max(
    1,
    racks.reduce((a, r) => a + (r.capacity_u || 42), 0),
  );
  const rackUtil = Math.round((servers.length / totalSlots) * 100);
  const healthy = servers.filter((s) => s.status === "healthy").length;
  const healthPct = servers.length ? Math.round((healthy / servers.length) * 100) : 0;

  const hour = new Date().getHours();
  const greeting =
    hour < 5
      ? "Working late"
      : hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";
  const firstName = (user?.displayName ?? "").split(" ")[0];

  const statusDist = [
    {
      name: "Healthy",
      value: servers.filter((s) => s.status === "healthy").length,
      color: "var(--success)",
    },
    {
      name: "Warning",
      value: servers.filter((s) => s.status === "warning").length,
      color: "var(--warning)",
    },
    {
      name: "Critical",
      value: servers.filter((s) => s.status === "critical").length,
      color: "var(--destructive)",
    },
    {
      name: "Offline",
      value: servers.filter((s) => s.status === "offline").length,
      color: "var(--muted-foreground)",
    },
  ];

  return (
    <>
      <TopBar
        title="Infrastructure Overview"
        subtitle="Real-time fleet health, utilization & incidents"
      />
      <div className="space-y-6 p-6">
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card/80 via-card/60 to-card/40 p-5 backdrop-blur">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-primary/25 to-chart-4/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Welcome back
              </p>
              <h2 className="text-xl font-semibold tracking-tight">
                {greeting}
                {firstName ? `, ${firstName}` : ""}.
              </h2>
              <p className="text-xs text-muted-foreground">
                {activeInc > 0
                  ? `${activeInc} active incident${activeInc === 1 ? "" : "s"} across ${servers.length} servers · fleet health ${healthPct}%`
                  : `All ${servers.length} servers reporting nominal · fleet health ${healthPct}%`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to="/import">
                  <Upload className="h-3.5 w-3.5" /> Import data
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to="/log-analyzer">
                  <TerminalSquare className="h-3.5 w-3.5" /> Analyze logs
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-primary to-chart-4 text-primary-foreground hover:opacity-90"
              >
                <Link to="/optimization-advisor">
                  <Sparkles className="h-3.5 w-3.5" /> AI advisor{" "}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end">
          <ExportMenu
            rows={servers.map((s) => ({
              id: s.id,
              name: s.name,
              hostname: s.hostname,
              ip: s.ip,
              os: s.os,
              cpu: s.cpu,
              ram: s.ram,
              storage: s.storage,
              status: s.status,
              rack: s.rack_id,
            }))}
            filename={`fleet-snapshot-${new Date().toISOString().slice(0, 10)}`}
            title="Fleet Snapshot"
            subtitle="Server inventory and utilization"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Applications"
            value={applications.length}
            icon={Boxes}
            delta={`${applications.filter((a) => a.env === "Production").length} prod`}
            trend="up"
            accent="primary"
          />
          <StatCard
            label="Servers"
            value={servers.length}
            icon={Server}
            delta={`${healthPct}% healthy`}
            trend="up"
            accent="success"
          />
          <StatCard
            label="Active Incidents"
            value={activeInc}
            icon={AlertTriangle}
            delta={`${incidents.filter((i) => i.severity === "Critical").length} critical`}
            trend="down"
            accent="destructive"
          />
          <StatCard
            label="Rack Utilization"
            value={`${rackUtil}%`}
            icon={Activity}
            delta={`${racks.length} racks online`}
            trend="flat"
            accent="warning"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Fleet Utilization · 24h</h3>
                <p className="text-xs text-muted-foreground">
                  CPU, Memory and Network averaged across fleet
                </p>
              </div>
              <div className="flex gap-3 text-xs">
                <Legend2 color="var(--chart-1)" label="CPU" />
                <Legend2 color="var(--chart-2)" label="RAM" />
                <Legend2 color="var(--chart-3)" label="Net" />
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={fleetUtilization}>
                  <defs>
                    <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g3" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stroke="var(--chart-1)"
                    fill="url(#g1)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="ram"
                    stroke="var(--chart-2)"
                    fill="url(#g2)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="network"
                    stroke="var(--chart-3)"
                    fill="url(#g3)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border-border/60 bg-card/60 p-5 backdrop-blur">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">Server Health</h3>
              <p className="text-xs text-muted-foreground">Distribution by status</p>
            </div>
            <div className="h-48">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={statusDist}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {statusDist.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {statusDist.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="ml-auto font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Incidents · 7 day trend</h3>
                <p className="text-xs text-muted-foreground">By severity</p>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={incidentSeverityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                  />
                  <Bar dataKey="critical" stackId="a" fill="var(--destructive)" />
                  <Bar dataKey="high" stackId="a" fill="var(--warning)" />
                  <Bar dataKey="medium" stackId="a" fill="var(--info)" />
                  <Bar
                    dataKey="low"
                    stackId="a"
                    fill="var(--muted-foreground)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border-border/60 bg-card/60 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Top Server Load</h3>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {[...servers]
                .sort((a, b) => b.cpu - a.cpu)
                .slice(0, 5)
                .map((s) => (
                  <div key={s.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-medium">{s.name}</span>
                      <span className="text-muted-foreground">{s.cpu}%</span>
                    </div>
                    <Progress value={s.cpu} className="h-1.5" />
                  </div>
                ))}
              {servers.length === 0 && (
                <p className="text-xs text-muted-foreground">No server data.</p>
              )}
            </div>
          </Card>
        </div>

        <RecommendationsCard />

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Recent Incidents</h3>
              <p className="text-xs text-muted-foreground">Latest events from the operations log</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 font-medium">ID</th>
                  <th className="pb-2 font-medium">Title</th>
                  <th className="pb-2 font-medium">Severity</th>
                  <th className="pb-2 font-medium">Server</th>
                  <th className="pb-2 font-medium">Downtime</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.slice(0, 5).map((i) => (
                  <tr
                    key={i.id}
                    className="border-b border-border/30 last:border-0 hover:bg-card/40"
                  >
                    <td className="py-3 font-mono text-xs">{i.id.slice(0, 8)}</td>
                    <td className="py-3">{i.title}</td>
                    <td className="py-3">
                      <SeverityBadge severity={i.severity} />
                    </td>
                    <td className="py-3 font-mono text-xs text-muted-foreground">{i.server_id}</td>
                    <td className="py-3 text-muted-foreground">{i.downtime_min}m</td>
                    <td className="py-3">
                      <span className="rounded-md border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {i.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {incidents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                      No incidents recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

function Legend2({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
