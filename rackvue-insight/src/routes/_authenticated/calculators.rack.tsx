import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { TopBar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Server, Zap, Snowflake, Layers, History, Loader2, X } from "lucide-react";
import { listCalcHistory, saveCalc, deleteCalc } from "@/lib/calc-history.functions";

export const Route = createFileRoute("/_authenticated/calculators/rack")({
  component: RackCalculator,
});

type Inputs = {
  servers: number;
  uPerServer: number;
  powerW: number;
  coolingFactor: number;
  redundancy: number;
};

const RACK_U = 42;
const USABLE_U = 36;

function RackCalculator() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCalcHistory);
  const saveFn = useServerFn(saveCalc);
  const delFn = useServerFn(deleteCalc);

  const [inp, setInp] = useState<Inputs>({
    servers: 200, uPerServer: 2, powerW: 450, coolingFactor: 1.3, redundancy: 1.2,
  });

  const historyQ = useQuery({ queryKey: ["calc-history", "rack"], queryFn: () => listFn({ data: { kind: "rack" } }) });
  const history = (historyQ.data ?? []) as Array<{ id: string; inputs: Inputs; outputs: { racks: number; totalPowerKW: number } }>;

  const calc = useMemo(() => {
    const totalU = inp.servers * inp.uPerServer;
    const racks = Math.ceil((totalU * inp.redundancy) / USABLE_U);
    const totalPowerKW = (inp.servers * inp.powerW * inp.redundancy) / 1000;
    const coolingBTU = totalPowerKW * 3412 * inp.coolingFactor;
    const coolingTons = coolingBTU / 12000;
    const utilization = Math.min(100, Math.round((totalU / (racks * USABLE_U)) * 100));
    return { totalU, racks, totalPowerKW, coolingTons, utilization };
  }, [inp]);

  const saveMut = useMutation({
    mutationFn: () => saveFn({ data: { kind: "rack", inputs: inp, outputs: { racks: calc.racks, totalPowerKW: calc.totalPowerKW } } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calc-history", "rack"] }); toast.success("Saved to history"); },
    onError: () => toast.error("Failed to save"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calc-history", "rack"] }),
  });

  const rackVis = Array.from({ length: calc.racks }).map((_, i) => {
    const remaining = Math.max(0, calc.totalU - i * USABLE_U);
    const used = Math.min(USABLE_U, remaining);
    return { id: i, used, pct: Math.round((used / USABLE_U) * 100) };
  });

  return (
    <>
      <TopBar title="Rack Capacity Calculator" subtitle="Plan rack units, power & cooling for your fleet" />
      <div className="grid gap-6 p-6 lg:grid-cols-[380px_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Inputs</h3>
          </div>
          <div className="grid gap-3">
            <NumField label="Number of Servers" value={inp.servers} onChange={(v) => setInp({ ...inp, servers: v })} />
            <NumField label="Server Size (U)" value={inp.uPerServer} onChange={(v) => setInp({ ...inp, uPerServer: v })} />
            <NumField label="Power per Server (W)" value={inp.powerW} onChange={(v) => setInp({ ...inp, powerW: v })} />
            <NumField label="Cooling Factor" value={inp.coolingFactor} onChange={(v) => setInp({ ...inp, coolingFactor: v })} step={0.1} />
            <NumField label="Redundancy Factor" value={inp.redundancy} onChange={(v) => setInp({ ...inp, redundancy: v })} step={0.1} />
          </div>
          <div className="mt-4">
            <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <History className="mr-1 h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </Card>

        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Metric icon={<Layers className="h-4 w-4" />} label="Total Rack Units" value={`${calc.totalU} U`} />
            <Metric icon={<Server className="h-4 w-4" />} label="Racks Required" value={String(calc.racks)} />
            <Metric icon={<Zap className="h-4 w-4" />} label="Power" value={`${calc.totalPowerKW.toFixed(1)} kW`} />
            <Metric icon={<Snowflake className="h-4 w-4" />} label="Cooling" value={`${calc.coolingTons.toFixed(1)} tons`} />
          </div>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Data Center Layout</h3>
              <span className="text-xs text-muted-foreground">Space utilization: <span className="font-mono text-foreground">{calc.utilization}%</span></span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {rackVis.map((r) => (
                <RackVisual key={r.id} index={r.id + 1} used={r.used} />
              ))}
            </div>
          </Card>

          {history.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold">Calculation History</h3>
              <div className="grid gap-2">
                {history.map((h) => (
                  <div key={h.id} className="group flex items-center justify-between rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-xs transition hover:bg-muted/40">
                    <button
                      onClick={() => setInp(h.inputs)}
                      className="flex-1 text-left text-muted-foreground hover:text-foreground"
                      title="Load these inputs"
                    >
                      {h.inputs.servers} servers × {h.inputs.uPerServer}U · {h.inputs.powerW}W
                    </button>
                    <span className="mx-3 font-mono">{h.outputs.racks} racks · {h.outputs.totalPowerKW.toFixed(1)} kW</span>
                    <button
                      onClick={() => delMut.mutate(h.id)}
                      className="grid h-6 w-6 place-items-center rounded text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      aria-label="Delete entry"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function RackVisual({ index, used }: { index: number; used: number }) {
  const slots = Array.from({ length: RACK_U });
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-2">
      <div className="mb-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Rack #{String(index).padStart(2, "0")}</span>
        <span className="font-mono">{used}/{USABLE_U}U</span>
      </div>
      <div className="grid grid-cols-1 gap-[2px] rounded bg-background/60 p-1.5">
        {slots.map((_, i) => {
          const filled = i < used;
          return (
            <div
              key={i}
              className={`h-1 rounded-sm ${filled ? "bg-gradient-to-r from-primary to-chart-4" : "bg-muted/40"}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function NumField({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type="number" value={value} step={step} min={0} onChange={(e) => onChange(Number(e.target.value) || 0)} className="h-9" />
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
    </Card>
  );
}