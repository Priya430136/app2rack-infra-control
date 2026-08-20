import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import api from "./api";

export const listCalcHistory = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ kind: z.enum(["storage", "rack", "cloud"]) }).parse(i))
  .handler(async ({ data }) => {
    const { data: rows } = await api.get("/calc-history", { params: data });
    return rows ?? [];
  });

export const saveCalc = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({
    kind: z.enum(["storage", "rack", "cloud"]),
    label: z.string().max(200).optional(),
    inputs: z.record(z.string(), z.any()),
    outputs: z.record(z.string(), z.any()),
  }).parse(i))
  .handler(async ({ data }) => {
    const { data: res } = await api.post("/calc-history", data);
    return res;
  });

export const deleteCalc = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    await api.delete(`/calc-history/${data.id}`);
    return { ok: true };
  });
