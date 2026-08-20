import { useSyncExternalStore } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { getScenario, type ScenarioDataset } from "./demo-scenarios";

const STORAGE_KEY = "app2rack.demo-scenario";
const AFFECTED_KEYS: Array<readonly [string]> = [
  ["racks"], ["servers"], ["applications"], ["incidents"],
];

type Listener = () => void;
const listeners = new Set<Listener>();
let current: string | null =
  typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;

function emit() { listeners.forEach((l) => l()); }

export function subscribeScenario(l: Listener) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function getActiveScenarioId(): string | null { return current; }

export function useActiveScenarioId(): string | null {
  return useSyncExternalStore(
    subscribeScenario,
    getActiveScenarioId,
    () => null,
  );
}

function applyDataset(qc: QueryClient, dataset: ScenarioDataset) {
  qc.cancelQueries().catch(() => {});
  qc.setQueryDefaults(["racks"], { staleTime: Infinity, gcTime: Infinity, refetchOnWindowFocus: false, refetchOnMount: false, refetchOnReconnect: false, queryFn: async () => dataset.racks });
  qc.setQueryDefaults(["servers"], { staleTime: Infinity, gcTime: Infinity, refetchOnWindowFocus: false, refetchOnMount: false, refetchOnReconnect: false, queryFn: async () => dataset.servers });
  qc.setQueryDefaults(["applications"], { staleTime: Infinity, gcTime: Infinity, refetchOnWindowFocus: false, refetchOnMount: false, refetchOnReconnect: false, queryFn: async () => dataset.applications });
  qc.setQueryDefaults(["incidents"], { staleTime: Infinity, gcTime: Infinity, refetchOnWindowFocus: false, refetchOnMount: false, refetchOnReconnect: false, queryFn: async () => dataset.incidents });
  qc.setQueryData(["racks"], dataset.racks);
  qc.setQueryData(["servers"], dataset.servers);
  qc.setQueryData(["applications"], dataset.applications);
  qc.setQueryData(["incidents"], dataset.incidents);
}

function clearDefaults(qc: QueryClient) {
  for (const k of AFFECTED_KEYS) {
    qc.setQueryDefaults(k, {
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryFn: undefined as any,
    });
  }
}

export function activateScenario(qc: QueryClient, id: string) {
  const scenario = getScenario(id);
  if (!scenario) return;
  const dataset = scenario.build();
  applyDataset(qc, dataset);
  current = id;
  try { window.localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  emit();
}

export function clearScenario(qc: QueryClient) {
  current = null;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  clearDefaults(qc);
  for (const k of AFFECTED_KEYS) {
    qc.removeQueries({ queryKey: k, exact: true });
  }
  qc.invalidateQueries();
  emit();
}

/** Called once at app mount: if a scenario id is persisted, re-apply it. */
export function bootstrapScenario(qc: QueryClient) {
  if (typeof window === "undefined") return;
  const id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) return;
  const scenario = getScenario(id);
  if (!scenario) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  applyDataset(qc, scenario.build());
  current = id;
  emit();
}