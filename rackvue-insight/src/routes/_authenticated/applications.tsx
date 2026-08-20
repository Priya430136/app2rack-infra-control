import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, SeverityBadge } from "@/components/app/status-badge";
import { Plus, Search, Loader2, Pencil, Trash2, Archive } from "lucide-react";
import { ExportMenu } from "@/components/app/export-menu";
import { EmptyState } from "@/components/app/empty-state";
import { TableSkeleton, ErrorState } from "@/components/app/loading-states";
import { applicationsQO, serversQO } from "@/lib/infra-queries";
import { upsertApplication, deleteApplication, type ApplicationRow } from "@/lib/infra.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/applications")({ component: Page });

type Form = {
  id?: string; name: string; owner: string; env: "Production"|"UAT"|"Dev";
  criticality: "Critical"|"High"|"Medium"|"Low"; deployment: string;
  server_id: string | null; status: "healthy"|"warning"|"critical"|"offline";
};
const EMPTY: Form = { name: "", owner: "", env: "Production", criticality: "Medium", deployment: "Kubernetes", server_id: null, status: "healthy" };

function Page() {
  const qc = useQueryClient();
  const apps = useQuery(applicationsQO);
  const servers = useQuery(serversQO);
  const upsert = useServerFn(upsertApplication);
  const del = useServerFn(deleteApplication);

  const [q, setQ] = useState("");
  const [env, setEnv] = useState("All");
  const [dlg, setDlg] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  const filtered = useMemo(() => (apps.data ?? []).filter((a) =>
    (env === "All" || a.env === env) &&
    (a.name.toLowerCase().includes(q.toLowerCase()) || (a.owner ?? "").toLowerCase().includes(q.toLowerCase()))
  ), [apps.data, q, env]);

  const m = useMutation({
    mutationFn: (f: Form) => upsert({ data: f as any }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["applications"] }); setDlg(false); toast.success("Saved"); },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });
  const dm = useMutation({
    mutationFn: (v: { id: string; archive?: boolean }) => del({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["applications"] }); toast.success("Removed"); },
  });

  function openNew() { setForm(EMPTY); setDlg(true); }
  function openEdit(a: ApplicationRow) {
    setForm({ id: a.id, name: a.name, owner: a.owner ?? "", env: a.env, criticality: a.criticality, deployment: a.deployment ?? "", server_id: a.server_id, status: a.status });
    setDlg(true);
  }

  return (
    <>
      <TopBar title="Applications" subtitle={`${apps.data?.length ?? 0} applications`} />
      <div className="space-y-4 p-6">
        <Card className="border-border/60 bg-card/60 p-4 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or owner..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <div className="flex items-center gap-1 rounded-md border border-border/60 bg-background/40 p-1">
              {["All", "Production", "UAT", "Dev"].map((e) => (
                <button key={e} onClick={() => setEnv(e)}
                  className={`rounded px-3 py-1 text-xs font-medium transition ${env === e ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{e}</button>
              ))}
            </div>
            <ExportMenu rows={filtered} filename="applications" title="Applications Report" subtitle="Application inventory" />
            <Button size="sm" onClick={openNew}><Plus className="mr-1.5 h-3.5 w-3.5" />New App</Button>
          </div>
        </Card>

        {apps.isLoading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : apps.error ? (
          <ErrorState
            title="Failed to load applications"
            message={apps.error instanceof Error ? apps.error.message : undefined}
            onRetry={() => apps.refetch()}
            retrying={apps.isFetching}
          />
        ) : (apps.data ?? []).length === 0 ? (
          <EmptyState entity="applications" />
        ) : (
          <Card className="border-border/60 bg-card/60 backdrop-blur overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-background/30 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Owner</th>
                    <th className="px-4 py-3 font-medium">Env</th>
                    <th className="px-4 py-3 font-medium">Criticality</th>
                    <th className="px-4 py-3 font-medium">Deployment</th>
                    <th className="px-4 py-3 font-medium">Server</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const srv = (servers.data ?? []).find((s) => s.id === a.server_id);
                    return (
                      <tr key={a.id} className="border-b border-border/30 last:border-0 hover:bg-background/30">
                        <td className="px-4 py-3 font-medium">{a.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{a.owner}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                            a.env === "Production" ? "border-success/30 bg-success/10 text-success" :
                            a.env === "UAT" ? "border-warning/30 bg-warning/10 text-warning" :
                            "border-info/30 bg-info/10 text-info"}`}>{a.env}</span>
                        </td>
                        <td className="px-4 py-3"><SeverityBadge severity={a.criticality} /></td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{a.deployment}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{srv?.name ?? "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => dm.mutate({ id: a.id, archive: true })}><Archive className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete this application?")) dm.mutate({ id: a.id }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Edit Application" : "New Application"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Owner</Label><Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Deployment</Label><Input value={form.deployment} onChange={(e) => setForm({ ...form, deployment: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5"><Label>Env</Label>
                <Select value={form.env} onValueChange={(v) => setForm({ ...form, env: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Production","UAT","Dev"].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5"><Label>Criticality</Label>
                <Select value={form.criticality} onValueChange={(v) => setForm({ ...form, criticality: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Critical","High","Medium","Low"].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["healthy","warning","critical","offline"].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5"><Label>Server</Label>
              <Select value={form.server_id ?? "__none"} onValueChange={(v) => setForm({ ...form, server_id: v === "__none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="(none)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">(none)</SelectItem>
                  {(servers.data ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => m.mutate(form)} disabled={m.isPending || !form.name.trim()}>
              {m.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
