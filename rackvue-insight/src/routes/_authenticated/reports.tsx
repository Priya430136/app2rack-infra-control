import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { TopBar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Save, Trash2, Loader2 } from "lucide-react";
import { applicationsQO, serversQO, racksQO, metricsQO, reportsQO } from "@/lib/infra-queries";
import { saveReport, deleteReport } from "@/lib/reports.functions";
import { EmptyState } from "@/components/app/empty-state";
import { RecommendationsCard } from "@/components/app/recommendations-card";
import { exportCSV, exportPDF } from "@/lib/exporters";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  RadialBarChart, RadialBar, PolarAngleAxis, BarChart, Bar,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const apps = useQuery(applicationsQO);
  const serversQ = useQuery(serversQO);
  const racksQ = useQuery(racksQO);
  const metricsQ = useQuery(metricsQO);
  const savedReportsQ = useQuery(reportsQO);
  const saveFn = useServerFn(saveReport);
  const delFn = useServerFn(deleteReport);

  const applications = apps.data ?? [];
  const servers = serversQ.data ?? [];
  const racks = racksQ.data ?? [];
  const metrics = metricsQ.data ?? [];

  if (!serversQ.isLoading && servers.length === 0 && racks.length === 0) {
    return (
      <>
        <TopBar title="Reports & Analytics" subtitle="Operational insights and exportable reports" />
        <div className="p-6"><EmptyState entity="reporting data" /></div>
      </>
    );
  }

  const envDist = ["Production", "UAT", "Dev"].map((e) => ({
    name: e, apps: applications.filter((a) => a.env === e).length,
  }));
  const avgCpu = servers.length ? Math.round(servers.reduce((s, x) => s + x.cpu, 0) / servers.length) : 0;
  const avgRam = servers.length ? Math.round(servers.reduce((s, x) => s + x.ram, 0) / servers.length) : 0;
  const avgDisk = servers.length ? Math.round(servers.reduce((s, x) => s + x.storage, 0) / servers.length) : 0;

  const availability = metrics.length
    ? metrics.map((m: any) => ({
        hour: new Date(m.captured_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
        uptime: 99 + (m.cpu > 70 ? -1 : 0.5),
      }))
    : [];

  function exportFleetCsv() {
    exportCSV(
      servers.map((s) => ({
        name: s.name, hostname: s.hostname, ip: s.ip, os: s.os,
        cpu: s.cpu, ram: s.ram, storage: s.storage, status: s.status,
      })),
      `fleet-report-${new Date().toISOString().slice(0, 10)}`,
    );
  }

  function exportSummaryPdf() {
    exportPDF({
      title: "Infrastructure Summary Report",
      subtitle: "App2Rack — Operational insights",
      filename: `infra-summary-${new Date().toISOString().slice(0, 10)}`,
      rows: [
        { Metric: "Applications", Value: applications.length },
        { Metric: "Servers", Value: servers.length },
        { Metric: "Racks", Value: racks.length },
        { Metric: "Avg CPU", Value: `${avgCpu}%` },
        { Metric: "Avg Memory", Value: `${avgRam}%` },
        { Metric: "Avg Disk", Value: `${avgDisk}%` },
        ...envDist.map((e) => ({ Metric: `${e.name} apps`, Value: e.apps })),
      ],
    });
  }

  const saveMut = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          name: `Infrastructure Summary — ${new Date().toLocaleDateString()}`,
          type: "infrastructure_summary",
          params: {},
          summary: { applications: applications.length, servers: servers.length, racks: racks.length, avgCpu, avgRam, avgDisk },
        },
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reports"] }); toast.success("Report saved"); },
    onError: () => toast.error("Failed to save report"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });

  return (
    <>
      <TopBar title="Reports & Analytics" subtitle="Operational insights and exportable reports" />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={exportSummaryPdf}>
            <FileText className="mr-1.5 h-3.5 w-3.5" />Export PDF
          </Button>
          <Button size="sm" variant="outline" onClick={exportFleetCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" />Export CSV
          </Button>
          <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Save Snapshot
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[
            { label: "Avg CPU", value: avgCpu, color: "var(--chart-1)" },
            { label: "Avg Memory", value: avgRam, color: "var(--chart-2)" },
            { label: "Avg Disk", value: avgDisk, color: "var(--chart-3)" },
          ].map((m) => (
            <Card key={m.label} className="border-border/60 bg-card/60 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <div className="h-40">
                <ResponsiveContainer>
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: m.value }]} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" fill={m.color} cornerRadius={20} background={{ fill: "var(--muted)" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <p className="-mt-24 text-center text-3xl font-semibold">{m.value}%</p>
              <div className="mt-20" />
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border-border/60 bg-card/60 p-5 backdrop-blur">
            <h3 className="mb-4 text-sm font-semibold">Application Distribution by Environment</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={envDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="apps" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border-border/60 bg-card/60 p-5 backdrop-blur">
            <h3 className="mb-4 text-sm font-semibold">Infrastructure Availability · 24h</h3>
            <div className="h-64">
              {availability.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No metrics recorded yet.
                </div>
              ) : (
                <ResponsiveContainer>
                  <LineChart data={availability}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="hour" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis domain={[95, 100]} stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="uptime" stroke="var(--success)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        <RecommendationsCard />

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur">
          <h3 className="mb-4 text-sm font-semibold">Rack Utilization Heatmap</h3>
          <div className="grid grid-cols-6 gap-2">
            {racks.map((r) => {
              const occ = servers.filter(s => s.rack_id === r.id).length;
              const util = (occ / Math.max(1, r.capacity_u)) * 100;
              const color = util > 80 ? "var(--destructive)" : util > 50 ? "var(--warning)" : "var(--success)";
              return (
                <div key={r.id} className="rounded-md border border-border/60 p-3 text-center" style={{ background: `${color}15` }}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{r.name}</p>
                  <p className="mt-1 text-xl font-semibold" style={{ color }}>{Math.round(util)}%</p>
                  <p className="text-[10px] text-muted-foreground">{occ}/{r.capacity_u} U</p>
                </div>
              );
            })}
            {racks.length === 0 && <p className="col-span-6 text-center text-xs text-muted-foreground">No rack data.</p>}
          </div>
        </Card>

        <Card className="border-border/60 bg-card/60 p-5 backdrop-blur">
          <h3 className="mb-4 text-sm font-semibold">Saved Report Snapshots</h3>
          {savedReportsQ.isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : (savedReportsQ.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No saved snapshots yet — click "Save Snapshot" above to record one.</p>
          ) : (
            <div className="space-y-2">
              {(savedReportsQ.data ?? []).map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 rounded-md border border-border/40 bg-background/30 px-3 py-2 text-xs">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{r.name}</span>
                  <span className="text-muted-foreground">
                    {r.summary?.applications ?? 0} apps · {r.summary?.servers ?? 0} servers · avg CPU {r.summary?.avgCpu ?? 0}%
                  </span>
                  <span className="ml-auto text-muted-foreground">{new Date(r.generated_at ?? r.created_at).toLocaleString()}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => delMut.mutate(r.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
