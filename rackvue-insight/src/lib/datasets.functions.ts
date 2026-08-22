import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import api from "./api";

export const listDatasets = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await api.get("/datasets");
  return data ?? [];
});

const importInput = z.object({
  filename: z.string().min(1).max(255),
  kind: z.enum(["csv", "xlsx", "json"]),
  target: z.enum(["servers", "applications", "racks"]),
  rows: z.array(z.record(z.string(), z.any())).min(1).max(5000),
  mapping: z.record(z.string(), z.string()),
});

export const importDataset = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => importInput.parse(i))
  .handler(async ({ data }) => {
    // The backend actually validates and inserts each row into the target
    // table (racks/servers/applications) - see
    // server/src/services/import-engine.service.js - and returns real
    // imported/error counts rather than assuming every row succeeded.
    const { data: res } = await api.post("/datasets", {
      filename: data.filename,
      kind: data.kind,
      target_entity: data.target,
      mapping: data.mapping,
      rows: data.rows,
    });
    return { dataset: res, imported: res.imported_count, errors: res.errors ?? [] };
  });

export const deleteDataset = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    await api.delete(`/datasets/${data.id}`);
    return { ok: true };
  });
