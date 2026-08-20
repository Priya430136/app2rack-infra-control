import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  TerminalSquare, Upload, FilePlus2, Sparkles, Loader2, Search, AlertTriangle,
  Copy, FileDown, Printer, Trash2, Send, ShieldAlert, Server, Boxes, Workflow,
  Clock, TrendingUp, FileText, Zap, CheckCircle2, XCircle,
} from "lucide-react";
import { TopBar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import {
  runLogAnalysis, listLogAnalyses, deleteLogAnalysis, chatAboutLogs, type LogAnalysisReport,
} from "@/lib/log-analyzer.functions";
import { exportPDF } from "@/lib/exporters";

export const Route = createFileRoute("/_authenticated/log-analyzer")({ component: Page });

const MAX_SIZE = 25 * 1024 * 1024;
const SEV_COLORS: Record<string, string> = {
  CRITICAL: "text-red-400",
  ERROR: "text-red-300",
  WARNING: "text-amber-300",
  INFO: "text-sky-300",
  DEBUG: "text-muted-foreground",
};
const RISK_TONE: Record<string, string> = {
  Critical: "bg-red-500/15 text-red-300 border-red-500/30",
  High: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  Medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};
const PIE_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#38bdf8", "#8b5cf6"];

const EXAMPLE_LOGS: Record<string, string> = {
  server: `2026-07-06 12:40:11 INFO  server[web-01] request /api/orders 200 45ms
2026-07-06 12:42:03 WARN  server[web-01] slow query 1.2s SELECT * FROM orders
2026-07-06 12:44:22 ERROR server[web-01] TimeoutException: db connection timed out after 5000ms
2026-07-06 12:44:23 ERROR server[web-01] TimeoutException: db connection timed out after 5000ms
2026-07-06 12:46:12 ERROR server[web-01] api response 502 upstream failure
2026-07-06 12:49:44 CRITICAL server[web-01] health-check failed 5 consecutive times
2026-07-06 12:51:00 CRITICAL server[web-01] incident opened INC-4821`,
  incident: `INC-4821 opened Critical - web-01 unhealthy
INC-4821 timeline 12:44 db timeouts, 12:46 502s, 12:49 hc failing
INC-4821 mitigation: rollback deploy v2.4.1, restart pgbouncer`,
  deployment: `deploy v2.4.1 started at 12:38 by ci-bot
deploy step: migrate database schema
deploy WARN: connection-pool config changed from 40 to 10
deploy completed at 12:40`,
  monitoring: `metric cpu web-01 avg 78% last 5m
metric ram web-01 avg 62% last 5m
metric db.connections 100/100 SATURATED
metric http.5xx rate 24/min ALERT`,
  audit: `2026-07-06 12:35 user=alice action=deploy target=web-01
2026-07-06 12:52 user=bob action=incident.ack id=INC-4821`,
};

function Page() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"paste" | "upload" | "existing">("paste");
  const [logs, setLogs] = useState("");
  const [filename, setFilename] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [source, setSource] = useState<"paste" | "upload" | "existing">("paste");
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [progressStep, setProgressStep] = useState(0);
  const [report, setReport] = useState<LogAnalysisReport | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const runFn = useServerFn(runLogAnalysis);
  const listFn = useServerFn(listLogAnalyses);
  const delFn = useServerFn(deleteLogAnalysis);
  const chatFn = useServerFn(chatAboutLogs);

  const historyQ = useQuery({ queryKey: ["log-analyses"], queryFn: () => listFn() });

  const analyze = useMutation({
    mutationFn: async () => {
      const steps = ["Reading logs", "Detecting errors", "Finding root cause", "Comparing historical patterns", "Generating recommendations", "Preparing executive summary"];
      let i = 0;
      setProgressStep(0);
      const t = setInterval(() => { i = Math.min(i + 1, steps.length - 1); setProgressStep(i); }, 1500);
      try {
        const res = await runFn({ data: { logs, title: title || filename || "Log analysis", source, filename } });
        return res;
      } finally {
        clearInterval(t);
      }
    },
    onSuccess: (res) => {
      setReport(res.report);
      setChatHistory([]);
      qc.invalidateQueries({ queryKey: ["log-analyses"] });
      toast.success(res.sourceType === "ai" ? "AI analysis complete" : "Analysis complete (offline fallback)");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Analysis failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["log-analyses"] }); toast.success("Deleted"); },
  });

  function handleFile(f: File) {
    if (f.size > MAX_SIZE) return toast.error("File exceeds 25 MB limit");
    const okExt = /\.(log|txt|json|csv)$/i.test(f.name);
    if (!okExt) return toast.error("Unsupported file type. Use .log .txt .json .csv");
    const reader = new FileReader();
    reader.onload = () => {
      const txt = String(reader.result ?? "");
      setLogs(txt);
      setFilename(f.name);
      setSource("upload");
      toast.success(`Loaded ${f.name}`);
    };
    reader.onerror = () => toast.error("Failed to read file");
    reader.readAsText(f);
  }

  function loadExample(k: string) {
    setLogs(EXAMPLE_LOGS[k] ?? "");
    setSource("existing");
    setFilename(`${k}-logs.log`);
    toast.success(`Loaded ${k} logs`);
  }

  const lines = useMemo(() => logs.split(/\r?\n/), [logs]);
  const visibleLines = useMemo(() => {
    const q = search.toLowerCase();
    return lines
      .map((l, i) => ({ n: i + 1, l }))
      .filter(({ l }) => {
        if (filter !== "ALL") {
          const re = new RegExp(`\\b${filter}\\b`, "i");
          if (!re.test(l)) return false;
        }
        if (q && !l.toLowerCase().includes(q)) return false;
        return true;
      });
  }, [lines, filter, search]);

  function severityOfLine(l: string): keyof typeof SEV_COLORS | null {
    if (/critical|fatal|panic/i.test(l)) return "CRITICAL";
    if (/error|exception|failed/i.test(l)) return "ERROR";
    if (/warn/i.test(l)) return "WARNING";
    if (/debug/i.test(l)) return "DEBUG";
    if (/info/i.test(l)) return "INFO";
    return null;
  }

  async function askAi() {
    if (!question.trim() || !report) return;
    const q = question.trim();
    setChatHistory((h) => [...h, { role: "user", content: q }]);
    setQuestion("");
    setChatLoading(true);
    try {
      const res = await chatFn({ data: { question: q, logs, report, history: chatHistory } });
      setChatHistory((h) => [...h, { role: "assistant", content: res.answer }]);
    } catch {
      setChatHistory((h) => [...h, { role: "assistant", content: "Failed to reach AI." }]);
    } finally {
      setChatLoading(false);
    }
  }

  function copyReport() {
    if (!report) return;
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    toast.success("Report copied");
  }
  function downloadJson() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "log-analysis.json"; a.click(); URL.revokeObjectURL(url);
  }
  function downloadMarkdown() {
    if (!report) return;
    const md = `# Log Analysis\n\n**Severity:** ${report.severity} · **Confidence:** ${report.confidence}%\n\n## Executive Summary\n${report.executive_summary}\n\n## Root Cause\n${report.probable_root_cause}\n\n## Reasoning\n${report.reasoning}\n\n## Recommendations\n${["immediate","short_term","long_term","preventive"].map((k)=>`### ${k}\n${(report.recommendations as any)[k].map((r:any)=>`- **${r.priority}** ${r.action} _(effort: ${r.effort}, impact: ${r.impact})_`).join("\n")}`).join("\n\n")}\n\n## Executive Report\n${report.executive_report}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "log-analysis.md"; a.click(); URL.revokeObjectURL(url);
  }
  function downloadPdf() {
    if (!report) return;
    exportPDF({
      title: "AI Log Analysis",
      subtitle: `${report.severity} · ${report.confidence}% confidence`,
      filename: "log-analysis",
      rows: [
        { section: "Executive Summary", content: report.executive_summary },
        { section: "Root Cause", content: report.probable_root_cause },
        { section: "Reasoning", content: report.reasoning },
        { section: "Executive Report", content: report.executive_report },
      ],
    });
  }

  const processingSteps = ["Reading logs", "Detecting errors", "Finding root cause", "Comparing historical patterns", "Generating recommendations", "Preparing executive summary"];

  return (
    <>
      <TopBar title="AI Log Analyzer" subtitle="Upload logs — AI detects failures, root cause, impact and remediation" />
      <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden p-3 sm:space-y-6 sm:p-6">
        {/* Header card */}
        <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-card/60 to-chart-4/10 p-4 backdrop-blur sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-4 shadow-[var(--shadow-glow)] sm:h-12 sm:w-12">
              <TerminalSquare className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">AI Log Analyzer</h2>
              <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
                Upload application, server, kubernetes, docker, nginx, apache, linux, windows or cloud logs. AI will automatically
                detect failures, summarize errors, determine the probable root cause, identify affected infrastructure,
                estimate business impact and recommend remediation steps.
              </p>
            </div>
          </div>
        </Card>

        {/* Upload */}
        <Card className="border-border/60 bg-card/60 p-3 backdrop-blur sm:p-5">
          <Tabs value={tab} onValueChange={(v) => setTab(v as never)}>
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="paste" className="text-xs sm:text-sm"><FilePlus2 className="mr-1 h-3.5 w-3.5" />Paste</TabsTrigger>
              <TabsTrigger value="upload" className="text-xs sm:text-sm"><Upload className="mr-1 h-3.5 w-3.5" />Upload</TabsTrigger>
              <TabsTrigger value="existing" className="text-xs sm:text-sm"><FileText className="mr-1 h-3.5 w-3.5" />Existing</TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="mt-4 space-y-2">
              <Textarea
                value={logs}
                onChange={(e) => { setLogs(e.target.value); setSource("paste"); setFilename(undefined); }}
                placeholder="Paste logs here… thousands of lines supported."
                className="min-h-[220px] resize-y font-mono text-xs"
                maxLength={MAX_SIZE}
              />
              <p className="text-right text-[11px] text-muted-foreground">{logs.length.toLocaleString()} chars · {lines.length.toLocaleString()} lines · max 25 MB</p>
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 bg-background/40 p-10 transition hover:border-primary/50 hover:bg-primary/5"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Drop a log file or click to browse</p>
                <p className="text-xs text-muted-foreground">.log · .txt · .json · .csv · up to 25 MB</p>
                {filename && <Badge variant="secondary" className="mt-2">{filename}</Badge>}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".log,.txt,.json,.csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>
            </TabsContent>

            <TabsContent value="existing" className="mt-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-5">
                {Object.keys(EXAMPLE_LOGS).map((k) => (
                  <button
                    key={k}
                    onClick={() => loadExample(k)}
                    className="rounded-lg border border-border/60 bg-background/40 p-3 text-left text-xs capitalize transition hover:border-primary/50 hover:bg-primary/5"
                  >
                    <FileText className="mb-2 h-4 w-4 text-primary" />
                    {k} logs
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional title" className="w-full sm:max-w-xs" />
            <Button
              size="lg"
              disabled={!logs.trim() || analyze.isPending}
              onClick={() => analyze.mutate()}
              className="w-full bg-gradient-to-r from-primary to-chart-4 shadow-[var(--shadow-glow)] sm:w-auto"
            >
              {analyze.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Analyze with AI
            </Button>
            <p className="text-xs text-muted-foreground">Estimated 5–15 seconds</p>
          </div>
        </Card>

        {/* Log preview */}
        {logs && (
          <Card className="border-border/60 bg-card/60 p-3 backdrop-blur sm:p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">Log Preview</h3>
              <Badge variant="outline" className="text-[10px]">{lines.length} lines</Badge>
              <div className="hidden flex-1 sm:block" />
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="h-8 w-full pl-7 text-xs sm:w-48" />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["ALL","CRITICAL","ERROR","WARNING","INFO","DEBUG"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="h-64 rounded-md border border-border/40 bg-black/40 sm:h-72">
              <div className="p-3 font-mono text-[11px] leading-relaxed">
                {visibleLines.slice(0, 2000).map(({ n, l }) => {
                  const sev = severityOfLine(l);
                  return (
                    <div key={n} className="flex gap-3">
                      <span className="w-10 flex-shrink-0 select-none text-right text-muted-foreground/50">{n}</span>
                      <span className={`whitespace-pre-wrap break-all ${sev ? SEV_COLORS[sev] : "text-foreground/80"}`}>{l || " "}</span>
                    </div>
                  );
                })}
                {visibleLines.length > 2000 && (
                  <p className="mt-2 text-center text-[10px] text-muted-foreground">…{(visibleLines.length - 2000).toLocaleString()} more lines hidden</p>
                )}
              </div>
            </ScrollArea>
          </Card>
        )}

        {/* Loading */}
        {analyze.isPending && (
          <Card className="border-border/60 bg-card/60 p-4 backdrop-blur sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm font-medium">AI analysis in progress…</p>
            </div>
            <div className="space-y-2">
              {processingSteps.map((s, i) => (
                <div key={s} className="flex items-center gap-2 text-xs">
                  {i < progressStep ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> :
                   i === progressStep ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> :
                   <div className="h-3.5 w-3.5 rounded-full border border-border/60" />}
                  <span className={i <= progressStep ? "text-foreground" : "text-muted-foreground"}>{s}</span>
                </div>
              ))}
            </div>
            <Progress value={((progressStep + 1) / processingSteps.length) * 100} className="mt-4" />
          </Card>
        )}

        {/* Report */}
        {report && !analyze.isPending && <ReportView report={report} />}

        {/* Chat */}
        {report && (
          <Card className="border-border/60 bg-card/60 p-3 backdrop-blur sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Follow-up questions</h3>
            <ScrollArea className="mb-3 h-56 rounded-md border border-border/40 bg-background/40 p-3">
              {chatHistory.length === 0 && (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Try:</p>
                  <p>• Why did this happen?</p>
                  <p>• Explain the timeout errors.</p>
                  <p>• How can I prevent this?</p>
                  <p>• Show only database-related issues.</p>
                  <p>• What should I monitor next?</p>
                </div>
              )}
              {chatHistory.map((m, i) => (
                <div key={i} className={`mb-2 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-xs ${m.role === "user" ? "bg-primary/20 text-foreground" : "bg-muted/50 text-foreground"}`}>{m.content}</div>
                </div>
              ))}
              {chatLoading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Thinking…</div>}
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") askAi(); }}
                placeholder="Ask a follow-up question…"
                className="flex-1"
              />
              <Button onClick={askAi} disabled={chatLoading || !question.trim()}><Send className="h-4 w-4" /></Button>
            </div>
          </Card>
        )}

        {/* Export */}
        {report && (
          <Card className="border-border/60 bg-card/60 p-4 backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="mr-2 text-sm font-semibold">Export</h3>
              <Button size="sm" variant="outline" onClick={downloadPdf}><FileDown className="mr-1.5 h-3.5 w-3.5" />PDF</Button>
              <Button size="sm" variant="outline" onClick={downloadMarkdown}><FileDown className="mr-1.5 h-3.5 w-3.5" />Markdown</Button>
              <Button size="sm" variant="outline" onClick={downloadJson}><FileDown className="mr-1.5 h-3.5 w-3.5" />JSON</Button>
              <Button size="sm" variant="outline" onClick={copyReport}><Copy className="mr-1.5 h-3.5 w-3.5" />Copy</Button>
              <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-1.5 h-3.5 w-3.5" />Print</Button>
            </div>
          </Card>
        )}

        {/* History */}
        <Card className="border-border/60 bg-card/60 p-3 backdrop-blur sm:p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4" /> Previous Analyses</h3>
          {historyQ.isLoading && <Skeleton className="h-24 w-full" />}
          {historyQ.data?.length === 0 && <p className="text-xs text-muted-foreground">No prior analyses yet.</p>}
          <div className="space-y-2">
            {(historyQ.data ?? []).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium">{a.title}</span>
                    <Badge className={`text-[10px] ${RISK_TONE[a.severity] ?? ""}`} variant="outline">{a.severity ?? "?"}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{a.confidence}%</Badge>
                    <Badge variant="outline" className="text-[10px]">{a.source_type === "ai" ? "AI" : "Fallback"}</Badge>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{a.summary || a.filename || "—"}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()} · {a.line_count} lines</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setReport(a.report as LogAnalysisReport); toast.success("Loaded analysis"); }}>View</Button>
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function ReportView({ report }: { report: LogAnalysisReport }) {
  const conf = Math.max(0, Math.min(100, report.confidence));
  const circ = 2 * Math.PI * 32;
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary + confidence */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1fr_auto]">
        <Card className="border-border/60 bg-card/60 p-4 backdrop-blur sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">Executive Summary</h3>
            <Badge className={`${RISK_TONE[report.severity]}`} variant="outline">{report.severity}</Badge>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{report.executive_summary}</p>
          <div className="mt-4 rounded-md border border-border/40 bg-background/40 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Probable Root Cause</p>
            <p className="mt-1 text-sm font-medium">{report.probable_root_cause}</p>
          </div>
        </Card>
        <Card className="flex items-center justify-center border-border/60 bg-card/60 p-4 backdrop-blur sm:p-5">
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
              <circle cx="40" cy="40" r="32" fill="none" stroke="url(#g)" strokeWidth="6" strokeDasharray={circ} strokeDashoffset={circ - (circ * conf) / 100} strokeLinecap="round" className="transition-all duration-1000" />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--chart-4))" />
                </linearGradient>
              </defs>
            </svg>
            <p className="mt-2 text-2xl font-semibold">{conf}%</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</p>
          </div>
        </Card>
      </div>

      {/* Error summary */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-5">
        {[
          { l: "Total Errors", v: report.error_summary.total_errors, i: XCircle, c: "text-red-400" },
          { l: "Warnings", v: report.error_summary.warnings, i: AlertTriangle, c: "text-amber-400" },
          { l: "Critical", v: report.error_summary.critical_events, i: ShieldAlert, c: "text-red-500" },
          { l: "Repeated", v: report.error_summary.repeated_errors, i: TrendingUp, c: "text-orange-400" },
          { l: "Unique Exc.", v: report.error_summary.unique_exceptions, i: Zap, c: "text-sky-400" },
        ].map((s) => (
          <Card key={s.l} className="border-border/60 bg-card/60 p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
                <p className="mt-1 text-2xl font-semibold">{s.v}</p>
              </div>
              <s.i className={`h-5 w-5 ${s.c}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Timeline + Categories */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/60 p-4 backdrop-blur sm:p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4" /> Timeline</h3>
          <div className="relative space-y-4 border-l border-border/60 pl-6">
            {report.timeline.map((t, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary shadow-[var(--shadow-glow)]" />
                <p className="text-[11px] font-mono text-muted-foreground">{t.time}</p>
                <p className="text-sm">{t.event}</p>
              </div>
            ))}
            {report.timeline.length === 0 && <p className="text-xs text-muted-foreground">No timeline events extracted.</p>}
          </div>
        </Card>
        <Card className="border-border/60 bg-card/60 p-4 backdrop-blur sm:p-5">
          <h3 className="mb-4 text-sm font-semibold">Error Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.error_categories}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="percent" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Visualizations */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/60 p-4 backdrop-blur sm:p-5">
          <h3 className="mb-4 text-sm font-semibold">Error Frequency</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.visualizations.hourly_frequency}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="border-border/60 bg-card/60 p-4 backdrop-blur sm:p-5">
          <h3 className="mb-4 text-sm font-semibold">Severity Breakdown</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={report.visualizations.severity_breakdown} dataKey="value" nameKey="name" outerRadius={80} label={{ fontSize: 10 }}>
                  {report.visualizations.severity_breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Affected infrastructure */}
      <Card className="border-border/60 bg-card/60 p-4 backdrop-blur sm:p-5">
        <h3 className="mb-4 text-sm font-semibold">Affected Infrastructure</h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[
            { l: "Applications", v: report.affected_infrastructure.applications, i: Boxes },
            { l: "Servers", v: report.affected_infrastructure.servers, i: Server },
            { l: "Racks", v: report.affected_infrastructure.racks, i: Workflow },
            { l: "Services", v: report.affected_infrastructure.services, i: Zap },
            { l: "Databases", v: report.affected_infrastructure.databases, i: FileText },
            { l: "Containers", v: report.affected_infrastructure.containers, i: Boxes },
          ].map((c) => (
            <div key={c.l} className="rounded-lg border border-border/40 bg-background/40 p-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                <c.i className="h-3.5 w-3.5" />{c.l}
              </div>
              <div className="flex flex-wrap gap-1">
                {c.v.length === 0 && <span className="text-[10px] text-muted-foreground">None detected</span>}
                {c.v.map((n) => <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="border-border/60 bg-card/60 p-4 backdrop-blur sm:p-5">
        <h3 className="mb-4 text-sm font-semibold">AI Recommendations</h3>
        <Tabs defaultValue="immediate">
          <div className="-mx-1 overflow-x-auto">
            <TabsList className="w-max">
              <TabsTrigger value="immediate" className="text-xs sm:text-sm">Immediate</TabsTrigger>
              <TabsTrigger value="short_term" className="text-xs sm:text-sm">Short-term</TabsTrigger>
              <TabsTrigger value="long_term" className="text-xs sm:text-sm">Long-term</TabsTrigger>
              <TabsTrigger value="preventive" className="text-xs sm:text-sm">Preventive</TabsTrigger>
            </TabsList>
          </div>
          {(["immediate","short_term","long_term","preventive"] as const).map((k) => (
            <TabsContent key={k} value={k} className="mt-3 space-y-2">
              {(report.recommendations[k] ?? []).map((r, i) => (
                <div key={i} className="rounded-md border border-border/40 bg-background/40 p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">Priority: {r.priority}</Badge>
                    <Badge variant="outline" className="text-[10px]">Effort: {r.effort}</Badge>
                    <Badge variant="outline" className="text-[10px]">Impact: {r.impact}</Badge>
                  </div>
                  <p className="text-sm">{r.action}</p>
                </div>
              ))}
              {(report.recommendations[k] ?? []).length === 0 && <p className="text-xs text-muted-foreground">No {k.replace("_", " ")} recommendations.</p>}
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {/* Suggested commands + business impact */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/60 p-4 backdrop-blur sm:p-5">
          <h3 className="mb-3 text-sm font-semibold">Suggested Commands <span className="ml-1 text-[10px] font-normal text-muted-foreground">(suggestions only — review before running)</span></h3>
          <div className="space-y-2">
            {report.suggested_commands.map((c, i) => (
              <div key={i} className="rounded-md border border-border/40 bg-black/40 p-3 font-mono text-xs">
                <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="min-w-0 flex-1 break-all text-emerald-300">{c.command}</code>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(c.command); toast.success("Copied"); }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="border-border/60 bg-card/60 p-4 backdrop-blur sm:p-5">
          <h3 className="mb-3 text-sm font-semibold">Business Impact</h3>
          <dl className="space-y-2 text-sm">
            {Object.entries(report.business_impact).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-border/40 py-1.5">
                <dt className="text-xs capitalize text-muted-foreground">{k.replace(/_/g, " ")}</dt>
                <dd className="font-medium">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      {/* Similar incidents */}
      {report.similar_incidents.length > 0 && (
        <Card className="border-border/60 bg-card/60 p-4 backdrop-blur sm:p-5">
          <h3 className="mb-3 text-sm font-semibold">Similar Historical Incidents</h3>
          <div className="space-y-2">
            {report.similar_incidents.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 p-3 text-sm">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground">{s.id} · {s.severity}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{s.similarity}% match</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Executive report */}
      <Card className="border-border/60 bg-gradient-to-br from-card/60 to-primary/5 p-4 backdrop-blur sm:p-5">
        <h3 className="mb-3 text-sm font-semibold">Executive Report</h3>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{report.executive_report}</p>
      </Card>
    </div>
  );
}