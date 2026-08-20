import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { ChevronRight, Boxes, Server, Workflow, Building2 } from "lucide-react";
import { useState, useMemo } from "react";
import { applicationsQO, serversQO, racksQO } from "@/lib/infra-queries";
import { EmptyState } from "@/components/app/empty-state";

export const Route = createFileRoute("/_authenticated/mapping")({ component: Page });

function Page() {
  const apps = useQuery(applicationsQO);
  const serversQ = useQuery(serversQO);
  const racksQ = useQuery(racksQO);

  const applications = apps.data ?? [];
  const servers = serversQ.data ?? [];
  const racks = racksQ.data ?? [];
  const dcs = useMemo(() => Array.from(new Set(racks.map((r) => r.dc))), [racks]);

  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  if (!apps.isLoading && applications.length === 0 && servers.length === 0) {
    return (
      <>
        <TopBar title="Infrastructure Mapping" subtitle="Application → Server → Rack → Data Center dependency view" />
        <div className="p-6"><EmptyState entity="mapping data" /></div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Infrastructure Mapping" subtitle="Application → Server → Rack → Data Center dependency view" />
      <div className="p-6">
        <div className="mb-6 grid grid-cols-4 gap-4">
          {[
            { label: "Applications", value: applications.length, icon: Boxes, color: "var(--chart-1)" },
            { label: "Servers", value: servers.length, icon: Server, color: "var(--chart-2)" },
            { label: "Racks", value: racks.length, icon: Workflow, color: "var(--chart-3)" },
            { label: "Data Centers", value: dcs.length, icon: Building2, color: "var(--chart-4)" },
          ].map((s) => (
            <Card key={s.label} className="border-border/60 bg-card/60 p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{s.value}</p>
                </div>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
            </Card>
          ))}
        </div>

        <Card className="border-border/60 bg-card/60 p-6 backdrop-blur">
          <h3 className="mb-4 text-sm font-semibold">Dependency Tree</h3>
          <div className="space-y-1">
            {applications.slice(0, 25).map((app) => {
              const srv = servers.find((s) => s.id === app.server_id);
              const rack = racks.find((r) => r.id === srv?.rack_id);
              const isOpen = expandedApp === app.id;
              return (
                <div key={app.id}>
                  <button
                    onClick={() => setExpandedApp(isOpen ? null : app.id)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition hover:bg-background/40"
                  >
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                    <Boxes className="h-4 w-4 text-chart-1" />
                    <span className="font-medium">{app.name}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{app.env}</span>
                  </button>
                  {isOpen && (
                    <div className="ml-6 border-l border-dashed border-border/60 pl-4 py-2 space-y-2">
                      {srv ? (
                        <>
                          <Node icon={Server} color="var(--chart-2)" label={srv.name} sub={`${srv.hostname ?? "-"} · ${srv.ip ?? "-"}`} />
                          {rack && (
                            <>
                              <Connector />
                              <Node icon={Workflow} color="var(--chart-3)" label={rack.name} sub={`Slot U${srv.slot ?? "-"} · ${rack.temperature_c}°C`} />
                              <Connector />
                              <Node icon={Building2} color="var(--chart-4)" label={rack.dc} sub="Data Center" />
                            </>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No server linked.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {applications.length === 0 && <p className="text-xs text-muted-foreground">No applications mapped yet.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}

function Node({ icon: Icon, color, label, sub }: { icon: any; color: string; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border/60 bg-background/40 px-3 py-2">
      <div className="grid h-8 w-8 place-items-center rounded-md" style={{ background: `${color}22`, color }}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function Connector() {
  return <div className="ml-4 h-3 w-px bg-border" />;
}
