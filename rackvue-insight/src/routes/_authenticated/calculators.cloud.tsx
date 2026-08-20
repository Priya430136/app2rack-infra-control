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
import { Cloud, Cpu, MemoryStick, HardDrive, Globe, Lightbulb, History, Loader2, X } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listCalcHistory, saveCalc, deleteCalc } from "@/lib/calc-history.functions";

export const Route = createFileRoute("/_authenticated/calculators/cloud")({
  component: CloudCalculator,
});

type Inputs = {
  instances: number;
  ramGB: number;
  storageGB: number;
  bandwidthGB: number;
  backupGB: number;
  region: "us-east" | "eu-west" | "ap-south";
};

// Approx $/unit/month — for estimation only
const PRICING = {
  aws: { instance: 60, ramGB: 4.2, storageGB: 0.10, bandwidthGB: 0.09, backupGB: 0.05 },
  azure: { instance: 58, ramGB: 4.0, storageGB: 0.09, bandwidthGB: 0.087, backupGB: 0.045 },
  gcp: { instance: 55, ramGB: 3.8, storageGB: 0.085, bandwidthGB: 0.08, backupGB: 0.04 },
};
const REGION_MULT = { "us-east": 1.0, "eu-west": 1.08, "ap-south": 1.12 };

function CloudCalculator() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCalcHistory);
  const saveFn = useServerFn(saveCalc);
  const delFn = useServerFn(deleteCalc);

  const [inp, setInp] = useState<Inputs>({
    instances: 10, ramGB: 64, storageGB: 1000, bandwidthGB: 2000, backupGB: 500, region: "us-east",
  });

  const historyQ = useQuery({ queryKey: ["calc-history", "cloud"], queryFn: () => listFn({ data: { kind: "cloud" } }) });
  const history = (historyQ.data ?? []) as Array<{ id: string; inputs: Inputs; outputs: { aws: number; azure: number; gcp: number } }>;

  const result = useMemo(() => {
    const mult = REGION_MULT[inp.region];
    function cost(p: typeof PRICING.aws) {
      return mult * (
        inp.instances * p.instance +
        inp.ramGB * p.ramGB +
        inp.storageGB * p.storageGB +
        inp.bandwidthGB * p.bandwidthGB +
        inp.backupGB * p.backupGB
      );
    }
    const aws = cost(PRICING.aws);
    const azure = cost(PRICING.azure);
    const gcp = cost(PRICING.gcp);
    const cheapest = [["AWS", aws], ["Azure", azure], ["GCP", gcp]].sort((a, b) => (a[1] as number) - (b[1] as number))[0];
    const tips: string[] = [];
    if (inp.bandwidthGB > 1000) tips.push("Bandwidth is a major cost driver — use CDN caching to reduce egress by 40–60%.");
    if (inp.backupGB > inp.storageGB) tips.push("Backup exceeds primary — move cold backups to archival tier (Glacier/Archive).");
    if (inp.instances > 5) tips.push("Consider Reserved Instances or Savings Plans for 30–60% savings on steady workloads.");
    if (inp.ramGB / Math.max(1, inp.instances) > 32) tips.push("High RAM per instance — review for memory-bound workload rightsizing.");
    tips.push(`Cheapest provider for this profile: ${cheapest[0]} (~$${Math.round(cheapest[1] as number).toLocaleString()}/mo).`);
    return {
      data: [
        { name: "AWS", cost: Math.round(aws), color: "oklch(0.78 0.15 60)" },
        { name: "Azure", cost: Math.round(azure), color: "oklch(0.72 0.15 240)" },
        { name: "GCP", cost: Math.round(gcp), color: "oklch(0.78 0.15 140)" },
      ],
      tips,
    };
  }, [inp]);

  const saveMut = useMutation({
    mutationFn: () => {
      const [aws, azure, gcp] = result.data.map((d) => d.cost);
      return saveFn({ data: { kind: "cloud", inputs: inp, outputs: { aws, azure, gcp } } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calc-history", "cloud"] }); toast.success("Saved to history"); },
    onError: () => toast.error("Failed to save"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calc-history", "cloud"] }),
  });

  return (
    <>
      <TopBar title="Cloud Cost Estimator" subtitle="Compare AWS, Azure & GCP for your workload profile" />
      <div className="grid gap-6 p-6 lg:grid-cols-[380px_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Cloud className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Workload</h3>
          </div>
          <div className="grid gap-3">
            <NumField icon={<Cpu className="h-3.5 w-3.5" />} label="Compute Instances" value={inp.instances} onChange={(v) => setInp({ ...inp, instances: v })} />
            <NumField icon={<MemoryStick className="h-3.5 w-3.5" />} label="Total RAM (GB)" value={inp.ramGB} onChange={(v) => setInp({ ...inp, ramGB: v })} />
            <NumField icon={<HardDrive className="h-3.5 w-3.5" />} label="Storage (GB)" value={inp.storageGB} onChange={(v) => setInp({ ...inp, storageGB: v })} />
            <NumField label="Monthly Bandwidth (GB)" value={inp.bandwidthGB} onChange={(v) => setInp({ ...inp, bandwidthGB: v })} />
            <NumField label="Backup Storage (GB)" value={inp.backupGB} onChange={(v) => setInp({ ...inp, backupGB: v })} />
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground"><Globe className="mr-1 inline h-3.5 w-3.5" />Region</Label>
              <Select value={inp.region} onValueChange={(v) => setInp({ ...inp, region: v as Inputs["region"] })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east">US East</SelectItem>
                  <SelectItem value="eu-west">EU West</SelectItem>
                  <SelectItem value="ap-south">Asia Pacific</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <History className="mr-1 h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </Card>

        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            {result.data.map((d) => (
              <Card key={d.name} className="p-4">
                <div className="mb-1 text-xs text-muted-foreground">{d.name} · monthly</div>
                <div className="text-2xl font-semibold tracking-tight" style={{ color: d.color }}>
                  ${d.cost.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground">~${(d.cost * 12).toLocaleString()}/yr</div>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Cost Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="cost" radius={[8, 8, 0, 0]}>
                    {result.data.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="h-4 w-4 text-warning" />Optimization Recommendations
            </h3>
            <ul className="grid gap-2 text-xs text-muted-foreground">
              {result.tips.map((t, i) => (
                <li key={i} className="flex gap-2 rounded-md border border-border/40 bg-muted/20 p-2.5">
                  <span className="text-primary">→</span><span>{t}</span>
                </li>
              ))}
            </ul>
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
                      {h.inputs.instances} instances · {h.inputs.ramGB}GB RAM · {h.inputs.region}
                    </button>
                    <span className="mx-3 font-mono">AWS ${h.outputs.aws.toLocaleString()} · Azure ${h.outputs.azure.toLocaleString()} · GCP ${h.outputs.gcp.toLocaleString()}</span>
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

function NumField({ label, value, onChange, step = 1, icon }: { label: string; value: number; onChange: (v: number) => void; step?: number; icon?: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</Label>
      <Input type="number" value={value} step={step} min={0} onChange={(e) => onChange(Number(e.target.value) || 0)} className="h-9" />
    </div>
  );
}