import { createServerFn } from "@tanstack/react-start";
import api from "./api";

export const getIncidents = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await api.get("/incidents");
  return data;
});

export const createIncident = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { data: res } = await api.post("/incidents", data);
  return res;
});

export const updateIncidentStatus = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await api.post(`/incidents/${data.id}/status`, { status: data.status });
  return { success: true };
});
