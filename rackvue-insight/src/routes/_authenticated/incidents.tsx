import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { TopBar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/app/status-badge";
import { incidents as mockIncidents } from "@/lib/mock-data";
import { Plus, AlertTriangle, Clock, Loader2, Brain } from "lucide-react";
import { ExportMenu } from "@/components/app/export-menu";
import { ReportIncidentDialog } from "@/components/app/report-incident-dialog";
import { RcaPanel } from "@/components/app/rca-panel";
import { ListSkeleton, ErrorState } from "@/components/app/loading-states";
import { getIncidents } from "@/lib/incidents.functions";
import type { Incident } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/incidents")({ component: Page });

function Page() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rcaOpen, setRcaOpen] = useState(false);
  const [rcaIncident, setRcaIncident] = useState<Incident | null>(null);

  const openRca = (i: Incident) => {
    setRcaIncident(i);
    setRcaOpen(true);
  };

  const fetchIncidents = useServerFn(getIncidents);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["incidents"],
    queryFn: () => fetchIncidents(),
  });

  const dbIncidents: Incident[] = (data?.incidents ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    severity: i.severity,
    status: i.status,
    serverId: i.server_id,
    createdAt: i.created_at,
    downtimeMin: i.downtime_min,
    notes: i.notes ?? "",
  }));

  const hasLoaded = !isLoading && data !== undefined;
  const incidents = hasLoaded && dbIncidents.length === 0 ? mockIncidents : dbIncidents;
  const open = incidents.filter((i) => i.status !== "Resolved");

  return (
    <>
      <TopBar
        title="Incidents & Downtime"
        subtitle={`${open.length} active · ${incidents.length} total this week`}
      />
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-4 gap-4">
          {(["Critical", "High", "Medium", "Low"] as const).map((sev) => {
            const count = incidents.filter((i) => i.severity === sev).length;
            return (
              <Card key={sev} className="border-border/60 bg-card/60 p-4 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {sev}
                    </p>
                    <p className="mt-1 text-2xl font-semibold">{count}</p>
                  </div>
                  <SeverityBadge severity={sev} />
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">All Incidents</h3>
          {dbIncidents.length === 0 && !isLoading && (
            <span className="text-xs text-muted-foreground">Showing sample data</span>
          )}
          <div className="flex items-center gap-2">
            <ExportMenu
              rows={incidents}
              filename="incidents"
              title="Incidents Report"
              subtitle="Operational incidents log"
            />
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Report Incident
            </Button>
          </div>
        </div>

        {isLoading && <ListSkeleton count={5} />}

        {error && !isLoading && (
          <ErrorState
            title="Failed to load incidents"
            message={error instanceof Error ? error.message : "Showing sample data as fallback."}
            onRetry={() => refetch()}
          />
        )}

        <div className="space-y-3">
          {incidents.map((i) => (
            <Card
              key={i.id}
              className="border-border/60 bg-card/60 p-4 backdrop-blur transition hover:border-primary/30"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`mt-0.5 grid h-9 w-9 place-items-center rounded-md ${
                    i.severity === "Critical"
                      ? "bg-destructive/15 text-destructive"
                      : i.severity === "High"
                        ? "bg-warning/15 text-warning"
                        : "bg-info/15 text-info"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{i.id}</span>
                    <SeverityBadge severity={i.severity} />
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        i.status === "Resolved"
                          ? "border-success/30 bg-success/10 text-success"
                          : i.status === "Investigating"
                            ? "border-warning/30 bg-warning/10 text-warning"
                            : "border-destructive/30 bg-destructive/10 text-destructive"
                      }`}
                    >
                      {i.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{i.title}</p>
                  <p className="text-xs text-muted-foreground">{i.notes}</p>
                  <div className="flex items-center gap-4 pt-1 text-[11px] text-muted-foreground">
                    <span className="font-mono">{i.serverId}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(i.createdAt).toLocaleString()}
                    </span>
                    {i.downtimeMin > 0 && <span>Downtime: {i.downtimeMin}m</span>}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openRca(i)}
                  className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                >
                  <Brain className="mr-1.5 h-3.5 w-3.5" /> Analyze with AI
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <ReportIncidentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => refetch()}
      />
      <RcaPanel
        open={rcaOpen}
        onOpenChange={setRcaOpen}
        incident={
          rcaIncident
            ? {
                id: rcaIncident.id?.match(/^[0-9a-f-]{36}$/i) ? rcaIncident.id : undefined,
                title: rcaIncident.title,
                severity: rcaIncident.severity,
                serverId: rcaIncident.serverId?.match(/^[0-9a-f-]{36}$/i)
                  ? rcaIncident.serverId
                  : undefined,
                notes: rcaIncident.notes,
              }
            : null
        }
      />
    </>
  );
}
