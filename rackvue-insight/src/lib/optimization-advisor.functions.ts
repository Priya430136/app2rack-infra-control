import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import api from "./api";

export type OptimizationRecommendation = {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  confidence: number;
  effort: "Low" | "Medium" | "High";
  business_impact: string;
  expected_improvement: string;
  responsible_team: string;
  timeframe: "Immediate" | "This Week" | "This Month" | "Long-Term";
  target?: { type: "server" | "rack" | "application" | "storage" | "network" | "cost" | "security"; id?: string; name?: string };
};

export type OptimizationReport = {
  scores: {
    optimization: number;
    health: number;
    cost_efficiency: number;
    performance: number;
    reliability: number;
    security: number;
    scalability: number;
    power_efficiency: number;
    cooling_efficiency: number;
  };
  executive_summary: string;
  categories: {
    performance: OptimizationRecommendation[];
    rack: OptimizationRecommendation[];
    server: OptimizationRecommendation[];
    storage: OptimizationRecommendation[];
    incident_prevention: OptimizationRecommendation[];
    cost: OptimizationRecommendation[];
    capacity: OptimizationRecommendation[];
    security: OptimizationRecommendation[];
    high_availability: OptimizationRecommendation[];
  };
  cost_savings: {
    monthly_estimate: number;
    yearly_estimate: number;
    breakdown: Array<{ area: string; amount: number }>;
  };
  capacity_forecast: {
    horizon: Array<{ period: "30d" | "90d" | "180d" | "1y"; cpu: number; memory: number; storage: number; power: number }>;
  };
  rack_utilization: Array<{ rack: string; current: number; projected: number; temperature: number }>;
  server_matrix: Array<{ server: string; cpu: number; ram: number; storage: number; status: string }>;
  risk_heatmap: Array<{ area: string; risk: number; confidence: number }>;
  radar: Array<{ dimension: string; value: number }>;
  timeline: {
    immediate: OptimizationRecommendation[];
    this_week: OptimizationRecommendation[];
    this_month: OptimizationRecommendation[];
    long_term: OptimizationRecommendation[];
  };
};

export const runOptimizationAnalysis = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ title: z.string().max(200).optional() }).parse(i ?? {}))
  .handler(async ({ data }) => {
    // The actual analysis (AI if configured, rule-based fallback otherwise) runs
    // server-side against the user's real infrastructure - see
    // server/src/services/optimization-engine.service.js.
    const { data: res } = await api.post("/optimization-advisor", { title: data.title });
    return { report: res.report as OptimizationReport, model: res.model as string, sourceType: res.source_type as string, savedId: res.id as string };
  });

export const listOptimizationAnalyses = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await api.get("/optimization-advisor");
    return data ?? [];
  });

export const deleteOptimizationAnalysis = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    await api.delete(`/optimization-advisor/${data.id}`);
    return { ok: true };
  });

export const chatAboutOptimization = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({
    question: z.string().min(1).max(2000),
    report: z.any().optional(),
    history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).max(20).optional(),
  }).parse(i))
  .handler(async ({ data }) => {
    const { data: res } = await api.post("/optimization-advisor/chat", data);
    return { answer: res.answer as string };
  });
