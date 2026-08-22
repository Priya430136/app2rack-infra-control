import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ScrollText,
  Filter,
  RotateCcw,
  ShieldCheck,
  UserIcon,
  Search,
  X,
} from "lucide-react";
import { listAuditLogs, type AuditLogRow } from "@/lib/audit-logs.functions";
import { ExportMenu } from "@/components/app/export-menu";
import { AuditLogDetailDrawer } from "@/components/app/audit-log-detail-drawer";

const searchSchema = z.object({
  role: fallback(z.string(), "all").default("all"),
  from: fallback(z.string(), "").default(""),
  to: fallback(z.string(), "").default(""),
  action: fallback(z.string(), "all").default("all"),
  entity: fallback(z.string(), "all").default("all"),
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/_authenticated/audit-logs")({
  component: Page,
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Audit Logs · App2Rack" },
      {
        name: "description",
        content: "Review recent user actions across your workspace with role and date filters.",
      },
    ],
  }),
});

type RoleFilter = "all" | "admin" | "moderator" | "user";

const roleStyles: Record<AuditLogRow["actor_role"], string> = {
  admin: "bg-primary/15 text-primary border-primary/30",
  moderator: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  user: "bg-muted text-muted-foreground border-border",
};

function toIsoStart(d: string) {
  if (!d) return undefined;
  return new Date(`${d}T00:00:00`).toISOString();
}
function toIsoEnd(d: string) {
  if (!d) return undefined;
  return new Date(`${d}T23:59:59.999`).toISOString();
}

function Page() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/audit-logs" });

  const roleAllowed = ["all", "admin", "moderator", "user"];
  const role: RoleFilter = (roleAllowed.includes(search.role) ? search.role : "all") as RoleFilter;
  const from = search.from;
  const to = search.to;
  const action = search.action;
  const entity = search.entity;
  const searchText = search.q;

  type SearchState = z.infer<typeof searchSchema>;
  type SearchPatch = Partial<SearchState>;
  const update = (patch: SearchPatch) => {
    void navigate({
      search: (prev: SearchState) => ({ ...prev, ...patch }),
      replace: true,
    });
  };

  const setRole = (v: RoleFilter) => update({ role: v });
  const setFrom = (v: string) => update({ from: v });
  const setTo = (v: string) => update({ to: v });
  const setAction = (v: string) => update({ action: v });
  const setEntity = (v: string) => update({ entity: v });
  const setSearchText = (v: string) => update({ q: v });

  const [selected, setSelected] = useState<AuditLogRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchLogs = useServerFn(listAuditLogs);

  const params = useMemo(
    () => ({ role, from: toIsoStart(from), to: toIsoEnd(to), limit: 200 }),
    [role, from, to],
  );

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => fetchLogs({ data: params }),
  });

  const allRows = data ?? [];

  const actionOptions = useMemo(
    () => Array.from(new Set(allRows.map((r) => r.action))).sort(),
    [allRows],
  );
  const entityOptions = useMemo(
    () =>
      Array.from(new Set(allRows.map((r) => r.entity_type).filter((v): v is string => !!v))).sort(),
    [allRows],
  );

  const rows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return allRows.filter((r) => {
      if (action !== "all" && r.action !== action) return false;
      if (entity !== "all" && r.entity_type !== entity) return false;
      if (q) {
        const hay = [
          r.action,
          r.entity_type ?? "",
          r.entity_id ?? "",
          r.actor_name ?? "",
          r.actor_email ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allRows, action, entity, searchText]);

  const exportRows = rows.map((r) => ({
    time: new Date(r.created_at).toLocaleString(),
    actor: r.actor_name ?? r.actor_email ?? r.user_id,
    role: r.actor_role,
    action: r.action,
    entity: r.entity_type ? `${r.entity_type}${r.entity_id ? `#${r.entity_id}` : ""}` : "",
    metadata: JSON.stringify(r.metadata ?? {}),
  }));

  function reset() {
    void navigate({
      search: { role: "all", from: "", to: "", action: "all", entity: "all", q: "" },
      replace: true,
    });
  }

  type QuickFilter = { key: string; label: string; clear: () => void };
  const activeQuickFilters: QuickFilter[] = [
    action !== "all"
      ? { key: "action", label: `action: ${action}`, clear: () => setAction("all") }
      : null,
    entity !== "all"
      ? { key: "entity", label: `entity: ${entity}`, clear: () => setEntity("all") }
      : null,
    searchText.trim()
      ? { key: "search", label: `“${searchText.trim()}”`, clear: () => setSearchText("") }
      : null,
  ].filter((v): v is QuickFilter => v !== null);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <TopBar title="Audit Logs" subtitle="Recent user actions across your workspace" />
      <main className="flex-1 space-y-6 px-4 py-6 md:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-chart-4/10 border border-primary/20">
              <ScrollText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
              <p className="text-sm text-muted-foreground">
                Recent actions across your workspace. Filter by role and date range.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExportMenu
              rows={exportRows}
              filename="audit-logs"
              title="Audit Logs"
              subtitle={`${rows.length} entries`}
            />
          </div>
        </header>

        <Card className="border-border/60 bg-card/60 p-4 backdrop-blur">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filters
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as RoleFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="user">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
              </Button>
              <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Apply
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {actionOptions.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Entity type</Label>
              <Select value={entity} onValueChange={setEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entities</SelectItem>
                  {entityOptions.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search actor, action, entity id…"
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {activeQuickFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Active
              </span>
              {activeQuickFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={f.clear}
                  className="group inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary hover:bg-primary/20"
                >
                  {f.label}
                  <X className="h-3 w-3 opacity-70 group-hover:opacity-100" />
                </button>
              ))}
              <span className="ml-1 text-[11px] text-muted-foreground">
                {rows.length} of {allRows.length} shown
              </span>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading audit logs…
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-destructive">
              {(error as Error).message}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No audit log entries match your filters yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Time</th>
                    <th className="px-4 py-2.5 text-left font-medium">Actor</th>
                    <th className="px-4 py-2.5 text-left font-medium">Role</th>
                    <th className="px-4 py-2.5 text-left font-medium">Action</th>
                    <th className="px-4 py-2.5 text-left font-medium">Entity</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => {
                        setSelected(r);
                        setDrawerOpen(true);
                      }}
                      className="cursor-pointer border-b border-border/40 last:border-0 hover:bg-muted/20"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium">{r.actor_name ?? "—"}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {r.actor_email ?? r.user_id.slice(0, 8)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className={roleStyles[r.actor_role]}>
                          {r.actor_role === "admin" ? (
                            <ShieldCheck className="mr-1 h-3 w-3" />
                          ) : (
                            <UserIcon className="mr-1 h-3 w-3" />
                          )}
                          {r.actor_role}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">{r.action}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {r.entity_type ? (
                          <span>
                            {r.entity_type}
                            {r.entity_id ? (
                              <span className="text-foreground/70"> · {r.entity_id}</span>
                            ) : null}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <AuditLogDetailDrawer row={selected} open={drawerOpen} onOpenChange={setDrawerOpen} />
      </main>
    </div>
  );
}
