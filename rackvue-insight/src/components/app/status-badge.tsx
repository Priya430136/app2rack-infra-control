import { cn } from "@/lib/utils";
import type { Status, Severity } from "@/lib/mock-data";

const statusStyles: Record<Status, string> = {
  healthy: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  offline: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        statusStyles[status],
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-success": status === "healthy",
          "bg-warning animate-pulse": status === "warning",
          "bg-destructive animate-pulse": status === "critical",
          "bg-muted-foreground": status === "offline",
        })}
      />
      {status}
    </span>
  );
}

const sevStyles: Record<Severity, string> = {
  Critical: "bg-destructive/15 text-destructive border-destructive/30",
  High: "bg-warning/15 text-warning border-warning/30",
  Medium: "bg-info/15 text-info border-info/30",
  Low: "bg-muted text-muted-foreground border-border",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        sevStyles[severity],
      )}
    >
      {severity}
    </span>
  );
}
