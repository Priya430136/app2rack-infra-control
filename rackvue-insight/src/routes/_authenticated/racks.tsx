import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { TopBar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Thermometer, Server as ServerIcon, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { racksQO, serversQO } from "@/lib/infra-queries";
import { upsertRack, deleteRack, type RackRow } from "@/lib/infra.functions";
import { EmptyState } from "@/components/app/empty-state";
import { CardGridSkeleton, ErrorState } from "@/components/app/loading-states";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/racks")({ component: Page });

type Form = { id?: string; name: string; dc: string; capacity_u: number; temperature_c: number };
const EMPTY: Form = { name: "", dc: "DC-East-01", capacity_u: 42, temperature_c: 22 };

function Page() {
  const qc = useQueryClient();
  const racks = useQuery(racksQO);
  const servers = useQuery(serversQO);
  const upsert = useServerFn(upsertRack);
  const del = useServerFn(deleteRack);
  const [dlg, setDlg] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  const m = useMutation({
    mutationFn: (f: Form) => upsert({ data: f as any }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["racks"] });
      setDlg(false);
      toast.success("Saved");
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });
  const dm = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["racks"] });
      toast.success("Removed");
    },
  });

  function openNew() {
    setForm(EMPTY);
    setDlg(true);
  }
  function openEdit(r: RackRow) {
    setForm({
      id: r.id,
      name: r.name,
      dc: r.dc,
      capacity_u: r.capacity_u,
      temperature_c: Number(r.temperature_c),
    });
    setDlg(true);
  }

  const dcCount = new Set((racks.data ?? []).map((r) => r.dc)).size;

  return (
    <>
      <TopBar
        title="Rack Management"
        subtitle={`${racks.data?.length ?? 0} racks across ${dcCount} data centers`}
      />
      <div className="flex items-center justify-end gap-2 px-6 pt-6">
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Rack
        </Button>
      </div>
      {racks.isLoading ? (
        <CardGridSkeleton count={6} minH={260} />
      ) : racks.error ? (
        <div className="p-6">
          <ErrorState
            title="Failed to load racks"
            message={racks.error instanceof Error ? racks.error.message : undefined}
            onRetry={() => racks.refetch()}
            retrying={racks.isFetching}
          />
        </div>
      ) : (racks.data ?? []).length === 0 ? (
        <div className="p-6">
          <EmptyState entity="racks" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
            {(racks.data ?? []).map((rack) => {
              const rackServers = (servers.data ?? []).filter((s) => s.rack_id === rack.id);
              const occupied = rackServers.length;
              const utilization = Math.round((occupied / Math.max(1, rack.capacity_u)) * 100);
              const temp = Number(rack.temperature_c);
              const tempColor =
                temp > 27 ? "var(--destructive)" : temp > 24 ? "var(--warning)" : "var(--success)";
              const display = Math.min(14, rack.capacity_u);
              return (
                <Card key={rack.id} className="border-border/60 bg-card/60 p-5 backdrop-blur">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold">{rack.name}</h3>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {rack.dc}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/40 px-2 py-1"
                        style={{ color: tempColor }}
                      >
                        <Thermometer className="h-3.5 w-3.5" />
                        <span className="font-mono text-xs font-semibold">{temp}°C</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openEdit(rack)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => {
                          if (confirm("Delete this rack?")) dm.mutate(rack.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mb-4 flex items-end justify-between text-xs">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-mono">
                      <span className="font-semibold text-foreground">{occupied}</span> /{" "}
                      {rack.capacity_u} U · {utilization}%
                    </span>
                  </div>
                  <div className="space-y-1 rounded-lg border border-border/60 bg-background/40 p-2">
                    {Array.from({ length: display }, (_, i) => {
                      const slot = display - i;
                      const srv = rackServers.find((s) => s.slot === slot);
                      return (
                        <div key={slot} className="flex items-center gap-2">
                          <span className="w-6 text-right font-mono text-[9px] text-muted-foreground">
                            U{slot}
                          </span>
                          {srv ? (
                            <div
                              className={`flex flex-1 items-center justify-between rounded border px-2 py-1 text-[10px] ${
                                srv.status === "healthy"
                                  ? "border-success/30 bg-success/10"
                                  : srv.status === "warning"
                                    ? "border-warning/30 bg-warning/10"
                                    : srv.status === "critical"
                                      ? "border-destructive/30 bg-destructive/10"
                                      : "border-border bg-muted/30"
                              }`}
                            >
                              <span className="flex items-center gap-1.5 font-mono">
                                <ServerIcon className="h-2.5 w-2.5" />
                                {srv.name}
                              </span>
                              <span className="font-mono text-muted-foreground">{srv.cpu}%</span>
                            </div>
                          ) : (
                            <div className="flex-1 rounded border border-dashed border-border/40 px-2 py-1 text-center text-[10px] text-muted-foreground/50">
                              empty
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Rack" : "New Rack"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Data Center</Label>
              <Input value={form.dc} onChange={(e) => setForm({ ...form, dc: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Capacity (U)</Label>
                <Input
                  type="number"
                  min={1}
                  max={96}
                  value={form.capacity_u}
                  onChange={(e) => setForm({ ...form, capacity_u: Number(e.target.value) || 42 })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Temperature °C</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.temperature_c}
                  onChange={(e) => setForm({ ...form, temperature_c: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => m.mutate(form)} disabled={m.isPending || !form.name.trim()}>
              {m.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
