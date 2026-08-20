import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Sparkles, Loader2, Brain, Send, Trash2, TrendingUp, DollarSign, ShieldCheck,
  Zap, Thermometer, HardDrive, Server as ServerIcon, Boxes, Activity, AlertTriangle,
  CheckCircle2, Clock, FileDown, Play,
} from "lucide-react";
import { TopBar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell,
} from "recharts";
import {
  runOptimizationAnalysis, listOptimizationAnalyses, deleteOptimizationAnalysis,
  chatAboutOptimization, type OptimizationReport, type OptimizationRecommendation,
} from "@/lib/optimization-advisor.functions";
import { exportPDF } from "@/lib/exporters";

export const Route = createFileRoute("/_authenticated/optimization-advisor")({ component: Page });

const PRIORITY_TONE: Record<string, string> = {
  High: "bg-red-500/15 text-red-300 border-red-500/30",
  Medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};
const PIE_COLORS = ["#8b5cf6", "#22d3ee", "#f59e0b", "#f97316", "#ef4444", "#10b981"];

function ScoreRing({ label, value, icon: Icon, tone = "primary" }: { label: string; value: number; icon: any; tone?: string }) {
  const size = 92; const stroke = 8; const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const color = tone === "warn" ? "#f59e0b" : tone === "danger" ? "#ef4444" : tone === "good" ? "#10b981" : "#8b5cf6";
  return (
    <Card className="glass-card p-4 flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" opacity={0.25} />
          <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
            strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 900ms ease-out" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{pct}</span>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <span className="text-[11px] text-center text-muted-foreground uppercase tracking-wide">{label}</span>
    </Card>
  );
}

function RecommendationCard({ r }: { r: OptimizationRecommendation }) {
  return (
    <Card className="glass-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug">{r.title}</h4>
        <Badge variant="outline" className={`shrink-0 ${PRIORITY_TONE[r.priority] ?? ""}`}>{r.priority}</Badge>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
        <div><span className="text-muted-foreground">Effort:</span> <span className="font-medium">{r.effort}</span></div>
        <div><span className="text-muted-foreground">Confidence:</span> <span className="font-medium">{r.confidence}%</span></div>
        <div className="col-span-2"><span className="text-muted-foreground">Impact:</span> <span className="font-medium">{r.business_impact}</span></div>
        <div className="col-span-2"><span className="text-muted-foreground">Gain:</span> <span className="font-medium text-emerald-300">{r.expected_improvement}</span></div>
        {r.target?.name && <div className="col-span-2"><span className="text-muted-foreground">Target:</span> <span className="font-medium">{r.target.name}</span></div>}
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1">
        <Button size="sm" variant="outline" className="h-7 text-[11px]"><CheckCircle2 className="h-3 w-3 mr-1" />Complete</Button>
        <Button size="sm" variant="ghost" className="h-7 text-[11px]">Export</Button>
        <Button size="sm" variant="ghost" className="h-7 text-[11px]">Ignore</Button>
      </div>
    </Card>
  );
}

function Page() {
  const qc = useQueryClient();
  const runFn = useServerFn(runOptimizationAnalysis);
  const listFn = useServerFn(listOptimizationAnalyses);
  const delFn = useServerFn(deleteOptimizationAnalysis);
  const chatFn = useServerFn(chatAboutOptimization);

  const [report, setReport] = useState<OptimizationReport | null>(null);
  const [chat, setChat] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [question, setQuestion] = useState("");

  const history = useQuery({ queryKey: ["optimization-analyses"], queryFn: () => listFn() });

  const runMut = useMutation({
    mutationFn: () => runFn({ data: {} }),
    onSuccess: (res) => {
      setReport(res.report);
      qc.invalidateQueries({ queryKey: ["optimization-analyses"] });
      toast.success(res.sourceType === "ai" ? "AI analysis complete" : "Heuristic analysis complete");
    },
    onError: (e: any) => toast.error(e.message ?? "Analysis failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["optimization-analyses"] }); toast.success("Deleted"); },
  });

  const chatMut = useMutation({
    mutationFn: (q: string) => chatFn({ data: { question: q, report, history: chat } }),
    onSuccess: (res, q) => setChat((prev) => [...prev, { role: "user", content: q }, { role: "assistant", content: res.answer }]),
  });

  const scores = report?.scores;
  const suggestedQs = useMemo(() => [
    "How can I reduce infrastructure cost?",
    "Which servers should I upgrade first?",
    "Why is rack utilization uneven?",
    "How can I improve availability?",
    "Show me the biggest risk areas.",
  ], []);

  return (
    <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
      <TopBar title="AI Optimization Advisor" subtitle="Intelligent infrastructure recommendations" />
      <div className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <Card className="glass-card p-4 sm:p-6 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 border-purple-500/20">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shrink-0">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight">AI Infrastructure Optimization Advisor</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Continuously analyze applications, servers, racks, health, utilization, incidents and metrics to generate intelligent optimization recommendations.
                </p>
              </div>
            </div>
            <Button onClick={() => runMut.mutate()} disabled={runMut.isPending}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg hover:opacity-90 w-full lg:w-auto">
              {runMut.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing…</> : <><Sparkles className="h-4 w-4 mr-2" />Run Infrastructure Analysis</>}
            </Button>
          </div>
        </Card>

        {/* Loading skeleton */}
        {runMut.isPending && !report && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        )}

        {/* Empty state */}
        {!report && !runMut.isPending && (
          <Card className="glass-card p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6 text-purple-300" />
              </div>
              <h3 className="text-lg font-semibold">Ready to optimize your infrastructure</h3>
              <p className="text-sm text-muted-foreground">
                Click <span className="font-medium text-foreground">Run Infrastructure Analysis</span> to have the AI review your entire environment and surface actionable recommendations.
              </p>
            </div>
          </Card>
        )}

        {report && (
          <>
            {/* Score cards */}
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
              <ScoreRing label="Optimization" value={scores!.optimization} icon={Sparkles} tone="primary" />
              <ScoreRing label="Health" value={scores!.health} icon={Activity} tone="good" />
              <ScoreRing label="Cost" value={scores!.cost_efficiency} icon={DollarSign} tone="primary" />
              <ScoreRing label="Performance" value={scores!.performance} icon={TrendingUp} tone="primary" />
              <ScoreRing label="Reliability" value={scores!.reliability} icon={ShieldCheck} tone="good" />
              <ScoreRing label="Security" value={scores!.security} icon={ShieldCheck} tone="primary" />
              <ScoreRing label="Scalability" value={scores!.scalability} icon={Boxes} tone="primary" />
              <ScoreRing label="Power" value={scores!.power_efficiency} icon={Zap} tone="warn" />
              <ScoreRing label="Cooling" value={scores!.cooling_efficiency} icon={Thermometer} tone="warn" />
            </div>

            {/* Executive summary */}
            <Card className="glass-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">AI Executive Summary</h3>
              </div>
              <p className="text-sm leading-relaxed">{report.executive_summary}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    exportPDF({
                      title: "Infrastructure Optimization Report",
                      subtitle: "AI-generated recommendations",
                      filename: `optimization-${Date.now()}.pdf`,
                      rows: [
                        { Metric: "Optimization", Score: report.scores.optimization },
                        { Metric: "Health", Score: report.scores.health },
                        { Metric: "Cost Efficiency", Score: report.scores.cost_efficiency },
                        { Metric: "Performance", Score: report.scores.performance },
                        { Metric: "Reliability", Score: report.scores.reliability },
                        { Metric: "Security", Score: report.scores.security },
                        { Metric: "Scalability", Score: report.scores.scalability },
                        { Metric: "Power Efficiency", Score: report.scores.power_efficiency },
                        { Metric: "Cooling Efficiency", Score: report.scores.cooling_efficiency },
                        { Metric: "Est. monthly savings ($)", Score: report.cost_savings.monthly_estimate },
                      ],
                    })
                  }
                >
                  <FileDown className="h-3.5 w-3.5 mr-1" />Export PDF
                </Button>
                <Button size="sm" variant="outline" onClick={() => runMut.mutate()}>
                  <Play className="h-3.5 w-3.5 mr-1" />Re-run Analysis
                </Button>
              </div>
            </Card>

            {/* Visualization grid */}
            <div id="optimization-report" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="glass-card p-4 lg:col-span-1">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Health Radar</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={report.radar}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <PolarRadiusAxis tick={{ fontSize: 9 }} />
                      <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.35} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="glass-card p-4 lg:col-span-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Rack Utilization (current vs projected)</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.rack_utilization}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="rack" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="current" fill="#22d3ee" name="Current %" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="projected" fill="#8b5cf6" name="Projected %" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="glass-card p-4 lg:col-span-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Capacity Forecast</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={report.capacity_forecast.horizon}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Line dataKey="cpu" stroke="#f59e0b" name="CPU %" strokeWidth={2} />
                      <Line dataKey="memory" stroke="#22d3ee" name="Memory %" strokeWidth={2} />
                      <Line dataKey="storage" stroke="#8b5cf6" name="Storage %" strokeWidth={2} />
                      <Line dataKey="power" stroke="#ef4444" name="Power %" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="glass-card p-4 lg:col-span-1">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Cost Savings Breakdown</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={report.cost_savings.breakdown} dataKey="amount" nameKey="area" outerRadius={70} label={{ fontSize: 10 }}>
                        {report.cost_savings.breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2">
                  <div className="text-2xl font-bold text-emerald-400">${report.cost_savings.monthly_estimate.toLocaleString()}/mo</div>
                  <div className="text-[11px] text-muted-foreground">${report.cost_savings.yearly_estimate.toLocaleString()} / year potential savings</div>
                </div>
              </Card>
            </div>

            {/* Risk heatmap + server matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="glass-card p-4">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Infrastructure Risk Heatmap</h4>
                <div className="space-y-2">
                  {report.risk_heatmap.map((r) => (
                    <div key={r.area} className="flex items-center gap-3">
                      <span className="text-xs w-40 truncate">{r.area}</span>
                      <div className="flex-1 h-6 bg-muted/30 rounded overflow-hidden relative">
                        <div className="h-full rounded transition-all"
                          style={{ width: `${r.risk}%`, background: r.risk > 70 ? "#ef4444" : r.risk > 50 ? "#f59e0b" : "#10b981" }} />
                        <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] text-white/90">{r.risk}%</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground w-14 text-right">conf {r.confidence}%</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="glass-card p-4">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Server Utilization Matrix</h4>
                <ScrollArea className="h-52">
                  <div className="space-y-2 pr-2">
                    {report.server_matrix.map((s) => (
                      <div key={s.server} className="grid grid-cols-4 gap-2 items-center text-xs">
                        <span className="truncate font-medium">{s.server}</span>
                        <div><div className="text-[10px] text-muted-foreground">CPU</div><Progress value={s.cpu} className="h-1.5" /></div>
                        <div><div className="text-[10px] text-muted-foreground">RAM</div><Progress value={s.ram} className="h-1.5" /></div>
                        <div><div className="text-[10px] text-muted-foreground">Disk</div><Progress value={s.storage} className="h-1.5" /></div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>

            {/* Recommendations */}
            <Card className="glass-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wide">Intelligent Recommendations</h3>
              </div>
              <Tabs defaultValue="performance" className="w-full">
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <TabsList className="w-max">
                    <TabsTrigger value="performance" className="text-xs">Performance</TabsTrigger>
                    <TabsTrigger value="rack" className="text-xs">Rack</TabsTrigger>
                    <TabsTrigger value="server" className="text-xs">Server</TabsTrigger>
                    <TabsTrigger value="storage" className="text-xs">Storage</TabsTrigger>
                    <TabsTrigger value="incident_prevention" className="text-xs">Incident Prev</TabsTrigger>
                    <TabsTrigger value="cost" className="text-xs">Cost</TabsTrigger>
                    <TabsTrigger value="capacity" className="text-xs">Capacity</TabsTrigger>
                    <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
                    <TabsTrigger value="high_availability" className="text-xs">HA</TabsTrigger>
                  </TabsList>
                </div>
                {(Object.keys(report.categories) as Array<keyof typeof report.categories>).map((k) => (
                  <TabsContent key={k} value={k} className="mt-3">
                    {report.categories[k].length === 0 ? (
                      <p className="text-xs text-muted-foreground p-4">No recommendations in this category.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {report.categories[k].map((r, i) => <RecommendationCard key={i} r={r} />)}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </Card>

            {/* Optimization roadmap */}
            <Card className="glass-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wide">Optimization Roadmap</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Immediate", items: report.timeline.immediate, tone: "border-red-500/30 bg-red-500/5" },
                  { label: "This Week", items: report.timeline.this_week, tone: "border-amber-500/30 bg-amber-500/5" },
                  { label: "This Month", items: report.timeline.this_month, tone: "border-cyan-500/30 bg-cyan-500/5" },
                  { label: "Long-Term", items: report.timeline.long_term, tone: "border-purple-500/30 bg-purple-500/5" },
                ].map((col) => (
                  <div key={col.label} className={`rounded-lg border p-3 space-y-2 ${col.tone}`}>
                    <div className="text-xs font-semibold uppercase tracking-wide">{col.label}</div>
                    {col.items.length === 0 ? <p className="text-[11px] text-muted-foreground">No items.</p> : col.items.map((it, i) => (
                      <div key={i} className="rounded bg-background/40 p-2 text-[11px]">
                        <div className="font-medium">{it.title}</div>
                        <div className="text-muted-foreground line-clamp-2 mt-0.5">{it.description}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Card>

            {/* Chat */}
            <Card className="glass-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wide">Ask the AI Advisor</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {suggestedQs.map((q) => (
                  <Button key={q} size="sm" variant="outline" className="h-7 text-[11px]"
                    onClick={() => { setQuestion(q); chatMut.mutate(q); }}>{q}</Button>
                ))}
              </div>
              {chat.length > 0 && (
                <ScrollArea className="h-56 mb-3 border border-border/40 rounded-lg p-3 bg-background/30">
                  <div className="space-y-3">
                    {chat.map((m, i) => (
                      <div key={i} className={`text-sm ${m.role === "user" ? "text-cyan-300" : "text-foreground"}`}>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground mr-2">{m.role}</span>
                        <span className="whitespace-pre-wrap">{m.content}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              <form onSubmit={(e) => { e.preventDefault(); if (!question.trim()) return; chatMut.mutate(question); setQuestion(""); }}
                className="flex gap-2">
                <Input value={question} onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask about infrastructure cost, upgrades, availability…" className="flex-1 text-sm" />
                <Button type="submit" disabled={chatMut.isPending || !question.trim()}>
                  {chatMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </Card>
          </>
        )}

        {/* History */}
        <Card className="glass-card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Historical Analyses</h3>
          </div>
          {history.isLoading ? (
            <Skeleton className="h-24" />
          ) : (history.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No previous analyses yet.</p>
          ) : (
            <div className="space-y-2">
              {(history.data ?? []).map((h: any) => (
                <div key={h.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/30 p-3 hover:bg-background/50 transition">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{h.title}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(h.created_at).toLocaleString()} · {h.model}</div>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-[11px]">
                    <Badge variant="outline">Score {h.optimization_score ?? "—"}</Badge>
                    <Badge variant="outline" className="text-emerald-300 border-emerald-500/30">${Number(h.estimated_savings_monthly ?? 0).toLocaleString()}/mo</Badge>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setReport(h.report)}>View</Button>
                  <Button size="sm" variant="ghost" onClick={() => delMut.mutate(h.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}