import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { racksQO, serversQO, applicationsQO } from "@/lib/infra-queries";
import { computeRecommendations } from "@/lib/recommendations";
import { Lightbulb, AlertTriangle, AlertCircle, Info } from "lucide-react";

export function RecommendationsCard() {
  const racks = useQuery(racksQO);
  const servers = useQuery(serversQO);
  const apps = useQuery(applicationsQO);
  const recs = computeRecommendations({
    racks: racks.data ?? [],
    servers: servers.data ?? [],
    applications: apps.data ?? [],
  });
  return (
    <Card className="border-border/60 bg-card/60 p-5 backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold">Infrastructure Recommendations</h3>
        <span className="ml-auto rounded-md border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          {recs.length} insight{recs.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="space-y-2">
        {recs.map((r) => {
          const Icon = r.level === "critical" ? AlertCircle : r.level === "warning" ? AlertTriangle : Info;
          const color = r.level === "critical" ? "var(--destructive)" : r.level === "warning" ? "var(--warning)" : "var(--info)";
          return (
            <div key={r.id} className="flex gap-3 rounded-md border border-border/60 bg-background/40 p-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} />
              <div className="leading-tight">
                <p className="text-sm font-medium">{r.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}