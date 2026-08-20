import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import api from "./api";

export type AuditLogRow = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, string | number | boolean | null>;
  created_at: string;
  actor_email: string | null;
  actor_name: string | null;
  actor_role: "admin" | "moderator" | "user";
};

const filterSchema = z.object({
  role: z.enum(["all", "admin", "moderator", "user"]).default("all"),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(500).default(200),
});

export const listAuditLogs = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => filterSchema.parse(i ?? {}))
  .handler(async ({ data }): Promise<AuditLogRow[]> => {
    const { data: rows } = await api.get("/audit-logs", { params: data });
    return rows ?? [];
  });

export const logAuditEvent = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        action: z.string().min(1).max(120),
        entity_type: z.string().max(60).optional(),
        entity_id: z.string().max(200).optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    await api.post("/audit-logs", data);
    return { ok: true };
  });
