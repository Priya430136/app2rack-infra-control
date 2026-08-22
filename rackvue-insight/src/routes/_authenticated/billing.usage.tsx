import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { myUsageQO } from "@/lib/billing-queries";
import { FEATURE_LABELS, type FeatureCode } from "@/lib/credit-costs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/billing/usage")({ component: UsagePage });

const COLORS = [
  "var(--primary)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--warning)",
];
const AXIS = "var(--muted-foreground)";
const GRID = "var(--border)";
const TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--card-foreground)",
  fontSize: 12,
};

const FEATURE_KEYS = [
  "log_analyzer",
  "rca",
  "optimization_advisor",
  "ai_chat",
  "ai_reports",
] as const;

function UsagePage() {
  const usageQ = useQuery(myUsageQO);
  const usage = usageQ.data ?? [];
  const isEmpty = usage.length === 0;

  const stats = useMemo(() => {
    // When there is no real usage yet, generate 30-day sample data so charts render.
    if (usage.length === 0) {
      const days = 30;
      const now = new Date();
      const dayData = Array.from({ length: days }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (days - 1 - i));
        const base = 12 + Math.round(Math.sin(i / 3) * 8 + Math.random() * 10);
        return { day: d.toISOString().slice(5, 10), credits: Math.max(0, base) };
      });
      const featureData = FEATURE_KEYS.map((k, i) => ({
        name: FEATURE_LABELS[k as FeatureCode] ?? k,
        value: 20 - i * 3 + Math.round(Math.random() * 6),
      }));
      const hourData = Array.from({ length: 24 }, (_, h) => ({
        hour: `${h.toString().padStart(2, "0")}h`,
        count: Math.round(
          2 + Math.max(0, Math.sin(((h - 9) / 24) * Math.PI * 2)) * 12 + Math.random() * 4,
        ),
      }));
      const totalReqs = featureData.reduce((s, f) => s + f.value, 0);
      const totalCredits = dayData.reduce((s, d) => s + d.credits, 0);
      const peakHour = hourData.reduce((a, b) => (b.count > a.count ? b : a), hourData[0]);
      const topFeature = featureData.slice().sort((a, b) => b.value - a.value)[0];
      return { totalReqs, totalCredits, featureData, dayData, hourData, peakHour, topFeature };
    }
    const totalReqs = usage.length;
    const totalCredits = usage.reduce((s, u) => s + u.credits_cost, 0);
    const byFeature = new Map<string, number>();
    const byDay = new Map<string, number>();
    const byHour = new Array(24).fill(0);
    for (const u of usage) {
      byFeature.set(u.feature, (byFeature.get(u.feature) ?? 0) + 1);
      const d = new Date(u.created_at).toISOString().slice(0, 10);
      byDay.set(d, (byDay.get(d) ?? 0) + u.credits_cost);
      byHour[new Date(u.created_at).getHours()] += 1;
    }
    const featureData = Array.from(byFeature.entries()).map(([k, v]) => ({
      name: FEATURE_LABELS[k as FeatureCode] ?? k,
      value: v,
    }));
    // Fill 30-day window so the line chart has an x-axis even with sparse data
    const map = new Map(Array.from(byDay.entries()));
    const now = new Date();
    const dayData = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      return { day: key.slice(5), credits: map.get(key) ?? 0 };
    });
    const hourData = byHour.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, "0")}h`,
      count,
    }));
    const peakHour = hourData.reduce((a, b) => (b.count > a.count ? b : a), hourData[0]);
    const topFeature = featureData.slice().sort((a, b) => b.value - a.value)[0];
    return { totalReqs, totalCredits, featureData, dayData, hourData, peakHour, topFeature };
  }, [usage]);

  return (
    <>
      <TopBar title="Usage Analytics" subtitle="AI usage insights and trends" />
      <div className="p-6 space-y-6">
        {isEmpty && (
          <Card className="border-primary/30 bg-primary/5 p-4 text-xs text-muted-foreground backdrop-blur">
            No AI usage recorded yet — showing sample analytics. Run any AI feature (Log Analyzer,
            RCA, Chat, Reports) to populate real data.
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Tile label="Total AI Requests" value={stats.totalReqs.toLocaleString()} />
          <Tile label="Credits Used" value={stats.totalCredits.toLocaleString()} />
          <Tile label="Peak Usage Hour" value={stats.peakHour?.hour ?? "—"} />
          <Tile label="Most Used Feature" value={stats.topFeature?.name ?? "—"} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/60 bg-card/60 p-5 backdrop-blur">
            <h3 className="mb-4 text-sm font-semibold">Credits Used per Day (30d)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stats.dayData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="day" stroke={AXIS} fontSize={11} interval={3} />
                <YAxis stroke={AXIS} fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="credits"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="border-border/60 bg-card/60 p-5 backdrop-blur">
            <h3 className="mb-4 text-sm font-semibold">Requests per Feature</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={stats.featureData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  innerRadius={45}
                  paddingAngle={2}
                >
                  {stats.featureData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="lg:col-span-2 border-border/60 bg-card/60 p-5 backdrop-blur">
            <h3 className="mb-4 text-sm font-semibold">Requests by Hour of Day</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.hourData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="hour" stroke={AXIS} fontSize={10} interval={1} />
                <YAxis stroke={AXIS} fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border/60 bg-card/60 p-5 backdrop-blur">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </Card>
  );
}
