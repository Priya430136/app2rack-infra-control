import { createServerFn } from "@tanstack/react-start";
import api from "./api";

// ============ RACKS ============
export const listRacks = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await api.get("/infra/racks");
    return data ?? [];
  });

export const upsertRack = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { data: res } = await api.post("/infra/racks", data);
    return { id: res.id };
  });

export const deleteRack = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    await api.delete(`/infra/racks/${data.id}`, { params: { archive: data.archive } });
    return { ok: true };
  });

// ============ SERVERS ============
export const listServers = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await api.get("/infra/servers");
    return data ?? [];
  });

export const upsertServer = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { data: res } = await api.post("/infra/servers", data);
    return { id: res.id };
  });

export const deleteServer = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    await api.delete(`/infra/servers/${data.id}`, { params: { archive: data.archive } });
    return { ok: true };
  });

// ============ APPLICATIONS ============
export const listApplications = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await api.get("/infra/applications");
    return data ?? [];
  });

export const upsertApplication = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { data: res } = await api.post("/infra/applications", data);
    return { id: res.id };
  });

export const deleteApplication = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    await api.delete(`/infra/applications/${data.id}`, { params: { archive: data.archive } });
    return { ok: true };
  });

// ============ METRICS ============
export const listMetrics = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await api.get("/infra/metrics");
    return data ?? [];
  });

// ============ SEED DEMO DATA ============
export const seedDemoData = createServerFn({ method: "POST" })
  .handler(async () => {
    const { data } = await api.post("/infra/seed");
    return data;
  });

// Types (Keep these for frontend compatibility)
export type RackRow = any;
export type ServerRow = any;
export type ApplicationRow = any;
export type MetricRow = any;
