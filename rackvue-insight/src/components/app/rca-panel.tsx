"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Brain,
  Copy,
  Download,
  RefreshCw,
  Save,
  AlertTriangle,
  ShieldAlert,
  Activity,
  Server as ServerIcon,
  Cpu,
  HardDrive,
  Network as NetIcon,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  History,
  Sparkles,
} from "lucide-react";
import {
  runRcaAnalysis,
  listRcaAnalyses,
  deleteRcaAnalysis,
  type RcaReport,
} from "@/lib/rca.functions";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  incident: {
    id?: string;
    title: string;
    severity: string;
    serverId?: string | null;
    notes?: string;
  } | null;
};

const riskColor = (r?: string) =>
  r === "Critical"
    ? "border-destructive/40 bg-destructive/15 text-destructive"
    : r === "High"
      ? "border-warning/40 bg-warning/15 text-warning"
      : r === "Medium"
        ? "border-info/40 bg-info/15 text-info"
        : "border-success/40 bg-success/15 text-success";

const confColor = (c: number) =>
  c >= 75 ? "text-success" : c >= 50 ? "text-info" : c >= 30 ? "text-warning" : "text-destructive";

function formatReportText(
  r: RcaReport,
  meta: { title: string; severity: string; model: string; source: string },
) {
  return [
    `# AI Root Cause Analysis — ${meta.title}`,
    `Severity: ${meta.severity}   Risk: ${r.risk_level}   Confidence: ${r.confidence}%   Model: ${meta.model} (${meta.source})`,
    ``,
    `## Executive Summary`,
    r.executive_summary,
    ``,
    `## Probable Root Cause`,
    r.probable_root_cause,
    ``,
    `## Affected Components`,
    ...r.affected_components.map((c) => `- ${c}`),
    ``,
    `## Reasoning`,
    r.reasoning,
    ``,
    `## Immediate Actions`,
    ...r.immediate_actions.map((a) => `- ${a}`),
    ``,
    `## Long-term Recommendations`,
    ...r.long_term_recommendations.map((a) => `- ${a}`),
    ``,
    `## Preventive Measures`,
    ...r.preventive_measures.map((a) => `- ${a}`),
    ``,
    `Estimated recovery: ${r.estimated_recovery_min} min`,
  ].join("\n");
}

function exportRcaPdf(
  r: RcaReport,
  meta: { title: string; severity: string; model: string; source: string },
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("AI Root Cause Analysis", 40, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`${meta.title} · ${new Date().toLocaleString()}`, 40, 68);

  autoTable(doc, {
    startY: 90,
    head: [["Field", "Value"]],
    body: [
      ["Severity", meta.severity],
      ["Risk Level", r.risk_level],
      ["Confidence", `${r.confidence}%`],
      ["Estimated Recovery", `${r.estimated_recovery_min} min`],
      ["Model", `${meta.model} (${meta.source})`],
    ],
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
  });

  const sections: Array<[string, string | string[]]> = [
    ["Executive Summary", r.executive_summary],
    ["Probable Root Cause", r.probable_root_cause],
    ["Affected Components", r.affected_components],
    ["Reasoning", r.reasoning],
    ["Immediate Actions", r.immediate_actions],
    ["Long-term Recommendations", r.long_term_recommendations],
    ["Preventive Measures", r.preventive_measures],
  ];
  let y = (doc as any).lastAutoTable.finalY + 20;
  doc.setTextColor(30);
  for (const [h, body] of sections) {
    if (y > 760) {
      doc.addPage();
      y = 50;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(h, 40, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const text = Array.isArray(body) ? body.map((b) => `• ${b}`).join("\n") : body;
    const lines = doc.splitTextToSize(text, 515);
    for (const line of lines) {
      if (y > 780) {
        doc.addPage();
        y = 50;
      }
      doc.text(line, 40, y);
      y += 13;
    }
    y += 8;
  }
  doc.save(`rca-${meta.title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  toast.success("PDF downloaded");
}

export function RcaPanel({ open, onOpenChange, incident }: Props) {
  const qc = useQueryClient();
  const run = useServerFn(runRcaAnalysis);
  const list = useServerFn(listRcaAnalyses);
  const del = useServerFn(deleteRcaAnalysis);

  const [current, setCurrent] = useState<{
    report: RcaReport;
    source: string;
    model: string;
    savedId: string | null;
    context: any;
  } | null>(null);
  const [showReasoning, setShowReasoning] = useState(true);
  const [showContext, setShowContext] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const history = useQuery({
    queryKey: ["rca-analyses", incident?.id ?? "all"],
    queryFn: () => list({ data: { incidentId: incident?.id } }),
    enabled: open,
  });

  const runMutation = useMutation({
    mutationFn: async (save: boolean) =>
      run({
        data: {
          incidentId: incident?.id,
          serverId: incident?.serverId ?? undefined,
          title: incident?.title,
          severity: incident?.severity,
          notes: incident?.notes,
          save,
        },
      }),
    onSuccess: (res) => {
      setCurrent(res);
      qc.invalidateQueries({ queryKey: ["rca-analyses"] });
      toast.success(res.source === "ai" ? "AI analysis complete" : "Offline analysis complete");
    },
    onError: (e: any) => toast.error(e?.message ?? "Analysis failed"),
  });

  // auto-run when panel opens
  useEffect(() => {
    if (open && incident && !current && !runMutation.isPending) {
      runMutation.mutate(true);
    }
    if (!open) {
      setCurrent(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, incident?.id]);

  const r = current?.report;
  const meta = useMemo(
    () => ({
      title: incident?.title ?? "Incident",
      severity: incident?.severity ?? "Medium",
      model: current?.model ?? "-",
      source: current?.source ?? "-",
    }),
    [incident, current],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l border-border/60 bg-background/95 p-0 backdrop-blur-xl sm:max-w-2xl"
      >
        <SheetHeader className="sticky top-0 z-10 space-y-1 border-b border-border/60 bg-background/80 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary">
              <Brain className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="truncate text-base">AI Root Cause Analysis</SheetTitle>
              <SheetDescription className="truncate text-xs">
                {incident?.title ?? "—"}
              </SheetDescription>
            </div>
            {current && (
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider",
                  riskColor(r?.risk_level),
                )}
              >
                {r?.risk_level} Risk
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-4 p-5">
          {runMutation.isPending && !current && <LoadingBlock />}

          {runMutation.isError && !current && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
              <div className="mb-2 flex items-center gap-2 font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" /> Analysis failed
              </div>
              <p className="text-muted-foreground">
                {(runMutation.error as any)?.message ?? "The AI service is unavailable."}
              </p>
              <Button size="sm" className="mt-3" onClick={() => runMutation.mutate(true)}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          )}

          {r && current && (
            <>
              {/* Meta strip */}
              <div className="grid grid-cols-3 gap-3">
                <MetaTile
                  label="Confidence"
                  value={`${r.confidence}%`}
                  accent={confColor(r.confidence)}
                  icon={<Sparkles className="h-3.5 w-3.5" />}
                />
                <MetaTile
                  label="Risk"
                  value={r.risk_level}
                  accent={riskColor(r.risk_level).split(" ")[2]}
                  icon={<ShieldAlert className="h-3.5 w-3.5" />}
                />
                <MetaTile
                  label="Recovery"
                  value={`${r.estimated_recovery_min}m`}
                  accent="text-info"
                  icon={<Clock className="h-3.5 w-3.5" />}
                />
              </div>

              {/* Confidence bar */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>AI Confidence</span>
                  <span className={confColor(r.confidence)}>{r.confidence}%</span>
                </div>
                <Progress value={r.confidence} className="h-2" />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Source: {current.source === "ai" ? "Lovable AI" : "Offline rule engine"} ·{" "}
                  {current.model}
                </p>
              </div>

              {/* Executive summary */}
              <Section title="Executive Summary" icon={<Activity className="h-3.5 w-3.5" />}>
                <p className="text-sm leading-relaxed text-foreground/90">{r.executive_summary}</p>
              </Section>

              {/* Root cause */}
              <Section
                title="Most Probable Root Cause"
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
              >
                <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm font-medium text-foreground">
                  {r.probable_root_cause}
                </p>
              </Section>

              {/* Affected */}
              <Section title="Infrastructure Affected" icon={<Layers className="h-3.5 w-3.5" />}>
                <div className="flex flex-wrap gap-1.5">
                  {r.affected_components.length === 0 && (
                    <span className="text-xs text-muted-foreground">None identified</span>
                  )}
                  {r.affected_components.map((c, i) => (
                    <span
                      key={i}
                      className="rounded-md border border-border/60 bg-card/60 px-2 py-0.5 font-mono text-[11px]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </Section>

              {/* Reasoning (expandable) */}
              <Collapsible open={showReasoning} onOpenChange={setShowReasoning}>
                <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md border border-border/60 bg-card/60 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:border-primary/30">
                  {showReasoning ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  <Brain className="h-3.5 w-3.5" /> Why the AI Reached This Conclusion
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-md border border-border/60 bg-card/40 p-3 text-sm leading-relaxed text-foreground/85">
                  {r.reasoning}
                </CollapsibleContent>
              </Collapsible>

              {/* Actions lists */}
              <div className="grid gap-3 md:grid-cols-2">
                <ListSection
                  title="Immediate Actions"
                  items={r.immediate_actions}
                  tone="destructive"
                />
                <ListSection
                  title="Long-term Recommendations"
                  items={r.long_term_recommendations}
                  tone="info"
                />
              </div>
              <ListSection
                title="Suggested Preventive Measures"
                items={r.preventive_measures}
                tone="success"
              />

              {/* Context snapshot */}
              <Collapsible open={showContext} onOpenChange={setShowContext}>
                <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md border border-border/60 bg-card/60 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:border-primary/30">
                  {showContext ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  <ServerIcon className="h-3.5 w-3.5" /> Context Snapshot Sent to AI
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2">
                  <ContextGrid ctx={current.context} />
                </CollapsibleContent>
              </Collapsible>

              {/* Actions */}
              <div className="sticky bottom-0 -mx-5 flex flex-wrap gap-2 border-t border-border/60 bg-background/90 p-4 backdrop-blur">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(formatReportText(r, meta));
                    toast.success("Report copied");
                  }}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportRcaPdf(r, meta)}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!current.savedId || runMutation.isPending}
                  onClick={async () => {
                    await runMutation.mutateAsync(true);
                  }}
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" /> {current.savedId ? "Saved" : "Save"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => runMutation.mutate(true)}
                  disabled={runMutation.isPending}
                  className="ml-auto"
                >
                  <RefreshCw
                    className={cn("mr-1.5 h-3.5 w-3.5", runMutation.isPending && "animate-spin")}
                  />
                  Re-run
                </Button>
              </div>

              {/* History */}
              <Collapsible open={showHistory} onOpenChange={setShowHistory}>
                <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md border border-border/60 bg-card/60 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:border-primary/30">
                  {showHistory ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  <History className="h-3.5 w-3.5" /> Previous Analyses ({history.data?.length ?? 0}
                  )
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2">
                  {(history.data ?? []).length === 0 && (
                    <p className="text-xs text-muted-foreground">No prior analyses stored.</p>
                  )}
                  {(history.data ?? []).map((h: any) => (
                    <button
                      key={h.id}
                      onClick={() =>
                        setCurrent({
                          report: h.report,
                          source: h.source,
                          model: h.model,
                          savedId: h.id,
                          context: h.context_snapshot,
                        })
                      }
                      className="flex w-full items-center gap-3 rounded-md border border-border/60 bg-card/40 p-2 text-left text-xs transition hover:border-primary/40"
                    >
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[10px] uppercase",
                          riskColor(h.risk_level),
                        )}
                      >
                        {h.risk_level ?? "—"}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                      <span
                        className={cn("ml-auto text-[11px] font-semibold", confColor(h.confidence))}
                      >
                        {h.confidence}%
                      </span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await del({ data: { id: h.id } });
                          toast.success("Deleted");
                          qc.invalidateQueries({ queryKey: ["rca-analyses"] });
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete analysis"
                      >
                        ×
                      </button>
                    </button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LoadingBlock() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-md border border-primary/30 bg-primary/5 p-4">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15">
          <Brain className="h-5 w-5 animate-pulse text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Analyzing infrastructure context…</p>
          <p className="text-xs text-muted-foreground">
            Collecting metrics, dependencies, history and running AI RCA.
          </p>
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function MetaTile({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-card/60 p-3">
      <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={cn("text-lg font-semibold", accent)}>{value}</p>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );
}

function ListSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "destructive" | "info" | "success";
}) {
  const toneClass =
    tone === "destructive"
      ? "border-destructive/30 bg-destructive/5"
      : tone === "info"
        ? "border-info/30 bg-info/5"
        : "border-success/30 bg-success/5";
  const dot =
    tone === "destructive" ? "bg-destructive" : tone === "info" ? "bg-info" : "bg-success";
  return (
    <div className={cn("rounded-md border p-3", toneClass)}>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
            <span className="text-foreground/85">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContextGrid({ ctx }: { ctx: any }) {
  const srv = ctx?.server;
  const rack = ctx?.rack;
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <div className="rounded-md border border-border/60 bg-card/40 p-3 text-xs">
        <div className="mb-1 flex items-center gap-1 font-semibold uppercase tracking-wider text-muted-foreground">
          <ServerIcon className="h-3 w-3" /> Server
        </div>
        <p className="font-mono">{srv?.hostname ?? srv?.name ?? "—"}</p>
        <p className="text-muted-foreground">
          {srv?.os ?? "—"} · {srv?.ip ?? ""}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <UtilMini icon={<Cpu className="h-3 w-3" />} label="CPU" v={srv?.cpu} />
          <UtilMini icon={<Activity className="h-3 w-3" />} label="RAM" v={srv?.ram} />
          <UtilMini icon={<HardDrive className="h-3 w-3" />} label="Disk" v={srv?.storage} />
        </div>
      </div>
      <div className="rounded-md border border-border/60 bg-card/40 p-3 text-xs">
        <div className="mb-1 flex items-center gap-1 font-semibold uppercase tracking-wider text-muted-foreground">
          <Layers className="h-3 w-3" /> Rack / DC
        </div>
        <p className="font-mono">{rack?.name ?? "—"}</p>
        <p className="text-muted-foreground">
          {rack?.dc ?? "—"} · {rack?.temperature_c ?? "?"}°C
        </p>
        <p className="mt-2 text-muted-foreground">
          {ctx?.linked_applications?.length ?? 0} linked apps · {ctx?.recent_metrics?.length ?? 0}{" "}
          metric points · {ctx?.similar_incidents?.length ?? 0} similar past incidents
        </p>
      </div>
      <div className="rounded-md border border-border/60 bg-card/40 p-3 text-xs md:col-span-2">
        <div className="mb-1 flex items-center gap-1 font-semibold uppercase tracking-wider text-muted-foreground">
          <NetIcon className="h-3 w-3" /> Fleet
        </div>
        <p className="text-muted-foreground">
          {ctx?.fleet_summary?.total_servers ?? 0} servers ·{" "}
          {ctx?.fleet_summary?.critical_count ?? 0} critical ·{" "}
          {ctx?.fleet_summary?.offline_count ?? 0} offline
        </p>
      </div>
    </div>
  );
}

function UtilMini({ icon, label, v }: { icon: React.ReactNode; label: string; v?: number }) {
  const val = typeof v === "number" ? v : 0;
  const color = val > 85 ? "text-destructive" : val > 70 ? "text-warning" : "text-success";
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={cn("font-mono text-sm font-semibold", color)}>
        {typeof v === "number" ? `${v}%` : "—"}
      </p>
    </div>
  );
}
