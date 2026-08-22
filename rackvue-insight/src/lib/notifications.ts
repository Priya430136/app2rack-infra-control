import { toast } from "sonner";
import type { Alert } from "./alerts";

// In-memory set: cleared on full page refresh. Prevents re-firing when the
// user navigates away and back to the dashboard within the same page load.
const firedThisLoad = new Set<string>();

const STORAGE_PREFIX = "notif-once:";

export interface NotifyOptions {
  /** Force re-show even if already fired (used by dev trigger). */
  force?: boolean;
  /** Router navigate function — required to wire up action buttons. */
  navigate?: (opts: { to: string }) => void;
}

export function notifyAlert(a: Alert, opts: NotifyOptions = {}) {
  const { force, navigate } = opts;

  if (!force) {
    // Dedupe within current page load (handles navigating back to dashboard).
    if (firedThisLoad.has(a.id)) return;

    // Non-critical: only once per browser session.
    // Critical: persistent — re-show after refresh, but still dedupe per load.
    if (a.level !== "critical" && typeof window !== "undefined") {
      if (sessionStorage.getItem(STORAGE_PREFIX + a.id)) return;
      sessionStorage.setItem(STORAGE_PREFIX + a.id, "1");
    }
  }
  firedThisLoad.add(a.id);

  const fn =
    a.level === "critical" ? toast.error : a.level === "warning" ? toast.warning : toast.info;

  const isIncident = a.kind === "incident" || a.kind === "downtime";
  const duration = a.level === "critical" ? 8000 : 4500;

  fn(a.title, {
    id: a.id,
    description: a.description,
    duration,
    action:
      isIncident && navigate
        ? {
            label: "View incident",
            onClick: () => navigate({ to: "/incidents" }),
          }
        : navigate
          ? {
              label: "View",
              onClick: () => navigate({ to: "/incidents" }),
            }
          : undefined,
    cancel: {
      label: a.level === "critical" ? "Acknowledge" : "Dismiss",
      onClick: () => toast.dismiss(a.id),
    },
  });
}

export function notifyAlerts(list: Alert[], opts: NotifyOptions = {}) {
  list.forEach((a, idx) => {
    setTimeout(() => notifyAlert(a, opts), 400 + idx * 650);
  });
}

export function resetSessionNotifications() {
  firedThisLoad.clear();
  if (typeof window === "undefined") return;
  Object.keys(sessionStorage)
    .filter((k) => k.startsWith(STORAGE_PREFIX))
    .forEach((k) => sessionStorage.removeItem(k));
}
