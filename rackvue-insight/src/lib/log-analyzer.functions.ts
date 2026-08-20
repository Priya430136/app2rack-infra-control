import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import api from "./api";

export type LogAnalysisReport = {
  executive_summary: string;
  probable_root_cause: string;
  confidence: number;
  severity: "Critical" | "High" | "Medium" | "Low";
  risk_level: "Critical" | "High" | "Medium" | "Low";
  reasoning: string;
  error_summary: {
    total_errors: number;
    warnings: number;
    critical_events: number;
    repeated_errors: number;
    unique_exceptions: number;
  };
  timeline: Array<{ time: string; event: string }>;
  affected_infrastructure: {
    applications: string[];
    servers: string[];
    racks: string[];
    services: string[];
    databases: string[];
    containers: string[];
  };
  error_categories: Array<{ category: string; percent: number }>;
  similar_incidents: Array<{ id: string; title: string; severity: string; similarity: number }>;
  recommendations: {
    immediate: Array<{ action: string; priority: string; effort: string; impact: string }>;
    short_term: Array<{ action: string; priority: string; effort: string; impact: string }>;
    long_term: Array<{ action: string; priority: string; effort: string; impact: string }>;
    preventive: Array<{ action: string; priority: string; effort: string; impact: string }>;
  };
  suggested_commands: Array<{ label: string; command: string }>;
  business_impact: {
    applications_affected: number;
    potential_downtime_min: number;
    customer_impact: string;
    risk_level: string;
    sla_impact: string;
    revenue_risk: string;
  };
  executive_report: string;
  visualizations: {
    hourly_frequency: Array<{ hour: string; count: number }>;
    severity_breakdown: Array<{ name: string; value: number }>;
  };
};

const MAX_LOG_CHARS = 25 * 1024 * 1024;

export const runLogAnalysis = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      logs: z.string().min(1).max(MAX_LOG_CHARS),
      title: z.string().max(200).optional(),
      source: z.enum(["paste", "upload", "existing"]).default("paste"),
      filename: z.string().max(200).optional(),
      save: z.boolean().optional().default(true),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    // The actual analysis (AI if configured, rule-based fallback otherwise)
    // runs server-side - see server/src/services/log-analyzer-engine.service.js.
    const { data: res } = await api.post("/log-analyzer", data);
    return { report: res.report, model: res.model, sourceType: res.source_type, savedId: res.id };
  });

export const listLogAnalyses = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await api.get("/log-analyzer");
    return data ?? [];
  });

export const deleteLogAnalysis = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => 
    z.object({ id: z.string() }).parse(i)
  )
  .handler(async ({ data }) => {
    await api.delete(`/log-analyzer/${data.id}`);
    return { ok: true };
  });

export const chatAboutLogs = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      question: z.string().min(1),
      logs: z.string().optional(),
      report: z.any().optional(),
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { data: res } = await api.post("/log-analyzer/chat", data);
    return { answer: res.answer as string };
  });
