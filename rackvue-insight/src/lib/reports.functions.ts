import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import api from "./api";

export const listReports = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await api.get("/reports");
    return data ?? [];
  });

export const saveReport = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({
    name: z.string().min(1).max(200),
    type: z.string().min(1).max(80),
    params: z.record(z.string(), z.any()).optional(),
    summary: z.record(z.string(), z.any()).optional(),
  }).parse(i))
  .handler(async ({ data }) => {
    const { data: res } = await api.post("/reports", data);
    return res;
  });

export const deleteReport = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    await api.delete(`/reports/${data.id}`);
    return { ok: true };
  });
