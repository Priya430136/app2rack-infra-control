import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FlaskConical, Check, X, AlertTriangle, ShieldAlert, Zap, Activity, Layers } from "lucide-react";
import {
  SCENARIOS, getScenario, type ScenarioTone,
} from "@/lib/demo-scenarios";
import {
  activateScenario, clearScenario, useActiveScenarioId,
} from "@/lib/demo-scenario-store";
import { toast } from "sonner";

const ICONS: Record<string, typeof Activity> = {
  "nominal": Activity,
  "cascading-outage": ShieldAlert,
  "peak-load": Zap,
  "ransomware": ShieldAlert,
  "capacity-crunch": Layers,
};

const TONE_COLOR: Record<ScenarioTone, string> = {
  healthy: "var(--success)",
  warning: "var(--warning)",
  critical: "var(--destructive)",
  info: "var(--primary)",
};

export function ScenarioSwitcher() {
  const qc = useQueryClient();
  const activeId = useActiveScenarioId();
  const active = getScenario(activeId);

  function pick(id: string) {
    const s = getScenario(id);
    if (!s) return;
    activateScenario(qc, id);
    toast.success(`Scenario loaded · ${s.name}`, { description: s.tagline });
  }

  function reset() {
    clearScenario(qc);
    toast.message("Restored live data");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={
            "hidden h-9 gap-1.5 border-border/60 md:inline-flex " +
            (active
              ? "bg-gradient-to-r from-primary/15 to-chart-4/10 text-foreground"
              : "bg-card/50 text-muted-foreground")
          }
        >
          <FlaskConical className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">
            {active ? active.name : "Demo scenarios"}
          </span>
          {active && (
            <span
              className="ml-1 h-1.5 w-1.5 rounded-full"
              style={{ background: TONE_COLOR[active.tone] }}
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] border-border/60 bg-popover/95 p-0 backdrop-blur-xl">
        <div className="px-3 pt-3 pb-2">
          <DropdownMenuLabel className="p-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Enterprise demo scenarios
          </DropdownMenuLabel>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Simulate outage and utilization patterns across the fleet. Overrides live data for this session.
          </p>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[26rem] overflow-y-auto p-1.5">
          {SCENARIOS.map((s) => {
            const Icon = ICONS[s.id] ?? Activity;
            const isActive = active?.id === s.id;
            return (
              <DropdownMenuItem
                key={s.id}
                onSelect={(e) => { e.preventDefault(); pick(s.id); }}
                className={
                  "flex items-start gap-3 rounded-md px-2.5 py-2.5 " +
                  (isActive ? "bg-primary/10 focus:bg-primary/15" : "focus:bg-accent/70")
                }
              >
                <span
                  className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border"
                  style={{
                    color: TONE_COLOR[s.tone],
                    borderColor: `color-mix(in oklab, ${TONE_COLOR[s.tone]} 40%, transparent)`,
                    background: `color-mix(in oklab, ${TONE_COLOR[s.tone]} 12%, transparent)`,
                  }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{s.name}</span>
                    {isActive && <Check className="h-3 w-3 text-primary" />}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] font-medium" style={{ color: TONE_COLOR[s.tone] }}>
                    {s.tagline}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                    {s.narrative}
                  </span>
                </span>
              </DropdownMenuItem>
            );
          })}
        </div>
        {active && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" /> Restore live data
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ScenarioBanner() {
  const qc = useQueryClient();
  const activeId = useActiveScenarioId();
  const active = getScenario(activeId);
  if (!active) return null;
  const color = TONE_COLOR[active.tone];
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-6 py-2 text-xs"
      style={{
        borderColor: `color-mix(in oklab, ${color} 35%, transparent)`,
        background: `linear-gradient(90deg, color-mix(in oklab, ${color} 14%, transparent), color-mix(in oklab, ${color} 4%, transparent))`,
      }}
    >
      <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color }}>
        <AlertTriangle className="h-3.5 w-3.5" /> Demo scenario active
      </span>
      <span className="font-medium text-foreground">{active.name}</span>
      <span className="text-muted-foreground">— {active.narrative}</span>
      <button
        type="button"
        onClick={() => { clearScenario(qc); toast.message("Restored live data"); }}
        className="ml-auto inline-flex items-center gap-1 rounded border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:text-foreground"
      >
        <X className="h-3 w-3" /> Restore live data
      </button>
    </div>
  );
}