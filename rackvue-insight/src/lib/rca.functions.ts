import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import api from "./api";

// ============ TYPES ============
export type RcaReport = {
  executive_summary: string;
  probable_root_cause: string;
  confidence: number; // 0-100
  affected_components: string[];
  reasoning: string;
  immediate_actions: string[];
  long_term_recommendations: string[];
  risk_level: "Critical" | "High" | "Medium" | "Low";
  estimated_recovery_min: number;
  preventive_measures: string[];
};

// ============ RUN ANALYSIS ============
export const runRcaAnalysis = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        incidentId: z.string().uuid().optional(),
        serverId: z.string().uuid().optional(),
        title: z.string().max(300).optional(),
        severity: z.string().max(20).optional(),
        notes: z.string().max(2000).optional(),
        save: z.boolean().optional().default(true),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    // The actual analysis (AI if configured, rule-based fallback otherwise) runs
    // server-side against the real incident/server/rack/metrics context - see
    // server/src/services/rca-engine.service.js.
    const { data: res } = await api.post("/rca/analyze", {
      incidentId: data.incidentId,
      serverId: data.serverId,
      title: data.title,
      severity: data.severity,
      save: data.save,
    });
    return {
      report: res.report as RcaReport,
      source: res.source as string,
      model: res.model as string,
      savedId: res.savedId as string | null,
      context: res.context,
    };
  });

// ============ LIST ============
export const listRcaAnalyses = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) =>
    z.object({ incidentId: z.string().uuid().optional() }).parse(i ?? {}),
  )
  .handler(async ({ data }) => {
    const { data: rows } = await api.get("/rca", { params: data });
    return rows ?? [];
  });

// ============ DELETE ============
export const deleteRcaAnalysis = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    await api.delete(`/rca/${data.id}`);
    return { ok: true };
  });
