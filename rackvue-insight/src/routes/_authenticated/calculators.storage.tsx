import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { TopBar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  HardDrive,
  TrendingUp,
  Database,
  ShieldAlert,
  History,
  Trash2,
  ArrowUpDown,
  X,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { exportPDF } from "@/lib/exporters";
import { listCalcHistory, saveCalc, deleteCalc } from "@/lib/calc-history.functions";

export const Route = createFileRoute("/_authenticated/calculators/storage")({
  component: StorageCalculator,
});

type Inputs = {
  users: number;
  uploadMB: number;
  uploadsPerDay: number;
  logsGB: number;
  replication: number;
  retentionMonths: number;
  growthPct: number;
};

const DEFAULTS: Inputs = {
  users: 100_000,
  uploadMB: 2,
  uploadsPerDay: 3,
  logsGB: 50,
  replication: 2,
  retentionMonths: 12,
  growthPct: 15,
};

type HistoryEntry = Inputs & { id: string; monthlyTB: number; yearlyTB: number };
type SortKey = "newest" | "monthly-desc" | "monthly-asc" | "users-desc";

function rowToEntry(row: {
  id: string;
  inputs: Inputs;
  outputs: { monthlyTB: number; yearlyTB: number };
}): HistoryEntry {
  return {
    ...row.inputs,
    id: row.id,
    monthlyTB: row.outputs.monthlyTB,
    yearlyTB: row.outputs.yearlyTB,
  };
}

function fmtTB(v: number) {
  if (v < 1) return `${(v * 1024).toFixed(1)} GB`;
  if (v >= 1024) return `${(v / 1024).toFixed(2)} PB`;
  return `${v.toFixed(2)} TB`;
}

function tier(monthlyTB: number) {
  if (monthlyTB < 10) return { label: "SSD — Standard", tone: "text-info" };
  if (monthlyTB < 100) return { label: "NVMe Cluster + Object Store", tone: "text-primary" };
  if (monthlyTB < 1000) return { label: "Hybrid Object Storage (S3-class)", tone: "text-warning" };
  return { label: "Distributed Object Storage + Cold Tier", tone: "text-destructive" };
}

function StorageCalculator() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCalcHistory);
  const saveFn = useServerFn(saveCalc);
  const delFn = useServerFn(deleteCalc);

  const [inp, setInp] = useState<Inputs>(DEFAULTS);
  const [sort, setSort] = useState<SortKey>("newest");

  const historyQ = useQuery({
    queryKey: ["calc-history", "storage"],
    queryFn: () => listFn({ data: { kind: "storage" } }),
  });
  const history: HistoryEntry[] = (historyQ.data ?? []).map(rowToEntry);

  const saveMut = useMutation({
    mutationFn: (entry: {
      label?: string;
      inputs: Inputs;
      outputs: { monthlyTB: number; yearlyTB: number };
    }) => saveFn({ data: { kind: "storage", ...entry } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calc-history", "storage"] });
      toast.success("Saved to history");
    },
    onError: () => toast.error("Failed to save"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calc-history", "storage"] }),
  });

  const calc = useMemo(() => {
    const dailyGB = (inp.users * inp.uploadMB * inp.uploadsPerDay) / 1024 + inp.logsGB;
    const monthlyTB = (dailyGB * 30) / 1024;
    const yearlyTB = monthlyTB * 12;
    const backupTB = monthlyTB * inp.replication;
    const forecast = Array.from({ length: 12 }).map((_, i) => ({
      month: `M${i + 1}`,
      storage: +(monthlyTB * Math.pow(1 + inp.growthPct / 100 / 12, i)).toFixed(2),
      backup: +(backupTB * Math.pow(1 + inp.growthPct / 100 / 12, i)).toFixed(2),
    }));
    const finalTB = forecast[forecast.length - 1].storage + forecast[forecast.length - 1].backup;
    const risk =
      finalTB > 500
        ? { label: "High", tone: "text-destructive" }
        : finalTB > 100
          ? { label: "Medium", tone: "text-warning" }
          : { label: "Low", tone: "text-success" };
    return { dailyGB, monthlyTB, yearlyTB, backupTB, forecast, risk, tier: tier(monthlyTB) };
  }, [inp]);

  function save() {
    saveMut.mutate({
      inputs: inp,
      outputs: { monthlyTB: calc.monthlyTB, yearlyTB: calc.yearlyTB },
    });
  }

  const sortedHistory = useMemo(() => {
    const copy = [...history];
    if (sort === "monthly-desc") copy.sort((a, b) => b.monthlyTB - a.monthlyTB);
    else if (sort === "monthly-asc") copy.sort((a, b) => a.monthlyTB - b.monthlyTB);
    else if (sort === "users-desc") copy.sort((a, b) => b.users - a.users);
    return copy;
  }, [history, sort]);

  function exportReport() {
    exportPDF({
      title: "Storage Sizing Report",
      subtitle: "App2Rack — Capacity Planning",
      filename: `storage-sizing-${new Date().toISOString().slice(0, 10)}`,
      rows: [
        { Metric: "Daily Active Users", Value: inp.users.toLocaleString() },
        { Metric: "Avg Upload Size (MB)", Value: inp.uploadMB },
        { Metric: "Uploads / user / day", Value: inp.uploadsPerDay },
        { Metric: "Daily Logs (GB)", Value: inp.logsGB },
        { Metric: "Replication Factor", Value: inp.replication },
        { Metric: "Retention (months)", Value: inp.retentionMonths },
        { Metric: "Growth %", Value: `${inp.growthPct}%` },
        { Metric: "Monthly Storage", Value: fmtTB(calc.monthlyTB) },
        { Metric: "Yearly Storage", Value: fmtTB(calc.yearlyTB) },
        { Metric: "Backup Storage", Value: fmtTB(calc.backupTB) },
        { Metric: "Recommended Tier", Value: calc.tier.label },
        { Metric: "Risk Level", Value: calc.risk.label },
      ],
    });
  }

  return (
    <>
      <TopBar
        title="Storage Sizing Calculator"
        subtitle="Estimate enterprise storage requirements & growth"
      />
      <div className="grid gap-6 p-6 lg:grid-cols-[380px_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Inputs</h3>
          </div>
          <div className="grid gap-3">
            <NumField
              label="Daily Active Users"
              value={inp.users}
              onChange={(v) => setInp({ ...inp, users: v })}
            />
            <NumField
              label="Avg Upload Size (MB)"
              value={inp.uploadMB}
              onChange={(v) => setInp({ ...inp, uploadMB: v })}
              step={0.5}
            />
            <NumField
              label="Uploads / user / day"
              value={inp.uploadsPerDay}
              onChange={(v) => setInp({ ...inp, uploadsPerDay: v })}
              step={0.5}
            />
            <NumField
              label="Daily Log Generation (GB)"
              value={inp.logsGB}
              onChange={(v) => setInp({ ...inp, logsGB: v })}
            />
            <NumField
              label="Backup Replication Factor"
              value={inp.replication}
              onChange={(v) => setInp({ ...inp, replication: v })}
            />
            <NumField
              label="Retention (months)"
              value={inp.retentionMonths}
              onChange={(v) => setInp({ ...inp, retentionMonths: v })}
            />
            <NumField
              label="Annual Growth (%)"
              value={inp.growthPct}
              onChange={(v) => setInp({ ...inp, growthPct: v })}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={save} disabled={saveMut.isPending}>
              {saveMut.isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <History className="mr-1 h-3.5 w-3.5" />
              )}
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={exportReport}>
              Export PDF
            </Button>
          </div>
        </Card>

        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Metric
              icon={<Database className="h-4 w-4" />}
              label="Monthly"
              value={fmtTB(calc.monthlyTB)}
            />
            <Metric
              icon={<TrendingUp className="h-4 w-4" />}
              label="Yearly"
              value={fmtTB(calc.yearlyTB)}
            />
            <Metric
              icon={<HardDrive className="h-4 w-4" />}
              label="Backup"
              value={fmtTB(calc.backupTB)}
            />
            <Metric
              icon={<ShieldAlert className="h-4 w-4" />}
              label="Risk"
              value={calc.risk.label}
              tone={calc.risk.tone}
            />
          </div>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">12-month Growth Forecast</h3>
              <span className={`text-xs font-medium ${calc.tier.tone}`}>
                Tier: {calc.tier.label}
              </span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={calc.forecast}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.15 200)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.78 0.15 200)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.18 30)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.72 0.18 30)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="storage"
                    name="Primary (TB)"
                    stroke="oklch(0.78 0.15 200)"
                    fill="url(#g1)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="backup"
                    name="Backup (TB)"
                    stroke="oklch(0.72 0.18 30)"
                    fill="url(#g2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {history.length > 0 && (
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Calculation History</h3>
                  <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {history.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      setSort((s) =>
                        s === "newest"
                          ? "monthly-desc"
                          : s === "monthly-desc"
                            ? "monthly-asc"
                            : s === "monthly-asc"
                              ? "users-desc"
                              : "newest",
                      )
                    }
                    className="flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted/40"
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {sort === "newest" && "Newest"}
                    {sort === "monthly-desc" && "Largest"}
                    {sort === "monthly-asc" && "Smallest"}
                    {sort === "users-desc" && "Most users"}
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => history.forEach((h) => delMut.mutate(h.id))}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Clear
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                {sortedHistory.map((h) => (
                  <div
                    key={h.id}
                    className="group flex items-center justify-between rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-xs transition hover:bg-muted/40"
                  >
                    <button
                      onClick={() =>
                        setInp({
                          users: h.users,
                          uploadMB: h.uploadMB,
                          uploadsPerDay: h.uploadsPerDay,
                          logsGB: h.logsGB,
                          replication: h.replication,
                          retentionMonths: h.retentionMonths,
                          growthPct: h.growthPct,
                        })
                      }
                      className="flex-1 text-left text-muted-foreground hover:text-foreground"
                      title="Load these inputs"
                    >
                      {h.users.toLocaleString()} users · {h.uploadMB}MB × {h.uploadsPerDay}/day · ×
                      {h.replication}
                    </button>
                    <span className="mx-3 font-mono">
                      {fmtTB(h.monthlyTB)} / mo · {fmtTB(h.yearlyTB)} / yr
                    </span>
                    <button
                      onClick={() => delMut.mutate(h.id)}
                      className="grid h-6 w-6 place-items-center rounded text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      aria-label="Delete entry"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value}
        step={step}
        min={0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-9"
      />
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-semibold tracking-tight ${tone ?? ""}`}>{value}</div>
    </Card>
  );
}
