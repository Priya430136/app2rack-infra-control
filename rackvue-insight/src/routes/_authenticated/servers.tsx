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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/app/status-badge";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Server as ServerIcon,
  Plus,
  Pencil,
  Trash2,
  Archive,
  Loader2,
} from "lucide-react";
import { ExportMenu } from "@/components/app/export-menu";
import { EmptyState } from "@/components/app/empty-state";
import { CardGridSkeleton, ErrorState } from "@/components/app/loading-states";
import { serversQO, racksQO } from "@/lib/infra-queries";
import { upsertServer, deleteServer, type ServerRow } from "@/lib/infra.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/servers")({ component: Page });

type Form = {
  id?: string;
  name: string;
  hostname: string;
  ip: string;
  os: string;
  cpu: number;
  ram: number;
  storage: number;
  status: "healthy" | "warning" | "critical" | "offline";
  rack_id: string | null;
  slot: number | null;
};
const EMPTY: Form = {
  name: "",
  hostname: "",
  ip: "",
  os: "Ubuntu 22.04",
  cpu: 0,
  ram: 0,
  storage: 0,
  status: "healthy",
  rack_id: null,
  slot: null,
};

function Page() {
  const qc = useQueryClient();
  const servers = useQuery(serversQO);
  const racks = useQuery(racksQO);
  const upsert = useServerFn(upsertServer);
  const del = useServerFn(deleteServer);
  const [dlg, setDlg] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  const m = useMutation({
    mutationFn: (f: Form) => upsert({ data: f as any }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servers"] });
      setDlg(false);
      toast.success("Saved");
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });
  const dm = useMutation({
    mutationFn: (v: { id: string; archive?: boolean }) => del({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servers"] });
      toast.success("Removed");
    },
  });

  function openNew() {
    setForm(EMPTY);
    setDlg(true);
  }
  function openEdit(s: ServerRow) {
    setForm({
      id: s.id,
      name: s.name,
      hostname: s.hostname ?? "",
      ip: s.ip ?? "",
      os: s.os ?? "",
      cpu: s.cpu,
      ram: s.ram,
      storage: s.storage,
      status: s.status,
      rack_id: s.rack_id,
      slot: s.slot,
    });
    setDlg(true);
  }

  const healthy = (servers.data ?? []).filter((s) => s.status === "healthy").length;

  return (
    <>
      <TopBar
        title="Servers"
        subtitle={`${servers.data?.length ?? 0} servers · ${healthy} healthy`}
      />
      <div className="flex items-center justify-end gap-2 px-6 pt-6">
        <ExportMenu
          rows={servers.data ?? []}
          filename="servers"
          title="Server Inventory"
          subtitle="Fleet inventory snapshot"
        />
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Server
        </Button>
      </div>
      {servers.isLoading ? (
        <CardGridSkeleton count={6} />
      ) : servers.error ? (
        <div className="p-6">
          <ErrorState
            title="Failed to load servers"
            message={servers.error instanceof Error ? servers.error.message : undefined}
            onRetry={() => servers.refetch()}
            retrying={servers.isFetching}
          />
        </div>
      ) : (servers.data ?? []).length === 0 ? (
        <div className="p-6">
          <EmptyState entity="servers" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
          {(servers.data ?? []).map((s) => {
            const rack = (racks.data ?? []).find((r) => r.id === s.rack_id);
            return (
              <Card
                key={s.id}
                className="border-border/60 bg-card/60 p-5 backdrop-blur transition hover:border-primary/40 hover:shadow-[var(--shadow-glow)]"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-md border border-border/60 bg-background/40">
                      <ServerIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.hostname ?? "—"}</p>
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <div className="mb-4 grid grid-cols-2 gap-2 text-[11px]">
                  <Cell label="IP" value={s.ip ?? "—"} mono />
                  <Cell label="OS" value={s.os ?? "—"} />
                  <Cell label="Rack" value={rack?.name ?? "—"} mono />
                  <Cell label="Slot" value={s.slot ? `U${s.slot}` : "—"} mono />
                </div>
                <div className="space-y-2.5">
                  <Metric icon={Cpu} label="CPU" value={s.cpu} />
                  <Metric icon={MemoryStick} label="RAM" value={s.ram} />
                  <Metric icon={HardDrive} label="Disk" value={s.storage} />
                </div>
                <div className="mt-4 flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => dm.mutate({ id: s.id, archive: true })}
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => {
                      if (confirm("Delete this server?")) dm.mutate({ id: s.id });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Server" : "New Server"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
              />
              <Field
                label="Hostname"
                value={form.hostname}
                onChange={(v) => setForm({ ...form, hostname: v })}
              />
              <Field label="IP" value={form.ip} onChange={(v) => setForm({ ...form, ip: v })} />
              <Field label="OS" value={form.os} onChange={(v) => setForm({ ...form, os: v })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NumF label="CPU %" value={form.cpu} onChange={(v) => setForm({ ...form, cpu: v })} />
              <NumF label="RAM %" value={form.ram} onChange={(v) => setForm({ ...form, ram: v })} />
              <NumF
                label="Disk %"
                value={form.storage}
                onChange={(v) => setForm({ ...form, storage: v })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["healthy", "warning", "critical", "offline"].map((x) => (
                      <SelectItem key={x} value={x}>
                        {x}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Rack</Label>
                <Select
                  value={form.rack_id ?? "__none"}
                  onValueChange={(v) => setForm({ ...form, rack_id: v === "__none" ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">(none)</SelectItem>
                    {(racks.data ?? []).map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <NumF
                label="Slot"
                value={form.slot ?? 0}
                onChange={(v) => setForm({ ...form, slot: v || null })}
                max={96}
              />
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

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function NumF({
  label,
  value,
  onChange,
  max = 100,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(0, Number(e.target.value) || 0)))}
      />
    </div>
  );
}
function Cell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-border/40 bg-background/30 px-2 py-1.5">
      <span className="text-muted-foreground">{label} </span>
      <span className={mono ? "font-mono" : ""}>{value}</span>
    </div>
  );
}
function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  const color =
    value > 85 ? "var(--destructive)" : value > 65 ? "var(--warning)" : "var(--success)";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className="font-mono font-medium" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-background/50">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}
