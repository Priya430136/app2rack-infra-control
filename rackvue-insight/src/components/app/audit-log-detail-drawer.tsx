import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollText, ShieldCheck, UserIcon, ArrowRight, Copy, Plus, Minus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { AuditLogRow } from "@/lib/audit-logs.functions";
import { cn } from "@/lib/utils";

const roleStyles: Record<AuditLogRow["actor_role"], string> = {
  admin: "bg-primary/15 text-primary border-primary/30",
  moderator: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  user: "bg-muted text-muted-foreground border-border",
};

type MetaValue = string | number | boolean | null | undefined;

function isPlainObject(v: unknown): v is Record<string, MetaValue> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function fmt(v: MetaValue): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

function DiffTable({
  before,
  after,
}: {
  before: Record<string, MetaValue>;
  after: Record<string, MetaValue>;
}) {
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();

  type ChangeKind = "added" | "removed" | "modified" | "unchanged";
  const classify = (k: string): ChangeKind => {
    const hasB = k in before && before[k] !== undefined && before[k] !== null && before[k] !== "";
    const hasA = k in after && after[k] !== undefined && after[k] !== null && after[k] !== "";
    if (hasB && !hasA) return "removed";
    if (!hasB && hasA) return "added";
    return fmt(before[k]) === fmt(after[k]) ? "unchanged" : "modified";
  };

  const classified = keys.map((k) => ({ key: k, kind: classify(k) }));
  const changed = classified.filter((c) => c.kind !== "unchanged");
  const counts = {
    added: changed.filter((c) => c.kind === "added").length,
    removed: changed.filter((c) => c.kind === "removed").length,
    modified: changed.filter((c) => c.kind === "modified").length,
  };

  const kindMeta: Record<ChangeKind, { label: string; chip: string; row: string; icon: typeof Plus }> = {
    added: {
      label: "added",
      chip: "bg-success/15 text-success border-success/30",
      row: "bg-success/5",
      icon: Plus,
    },
    removed: {
      label: "removed",
      chip: "bg-destructive/15 text-destructive border-destructive/30",
      row: "bg-destructive/5",
      icon: Minus,
    },
    modified: {
      label: "modified",
      chip: "bg-warning/15 text-warning border-warning/30",
      row: "bg-warning/5",
      icon: Pencil,
    },
    unchanged: {
      label: "unchanged",
      chip: "bg-muted text-muted-foreground border-border",
      row: "",
      icon: Pencil,
    },
  };

  return (
    <div className="space-y-2">
      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border/60 bg-card/40 px-2.5 py-2">
        {changed.length === 0 ? (
          <span className="text-[11px] text-muted-foreground">No field changes.</span>
        ) : (
          <>
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {changed.length} change{changed.length === 1 ? "" : "s"}
            </span>
            {counts.added > 0 && (
              <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]", kindMeta.added.chip)}>
                <Plus className="mr-0.5 h-2.5 w-2.5" />
                {counts.added} added
              </Badge>
            )}
            {counts.modified > 0 && (
              <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]", kindMeta.modified.chip)}>
                <Pencil className="mr-0.5 h-2.5 w-2.5" />
                {counts.modified} modified
              </Badge>
            )}
            {counts.removed > 0 && (
              <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]", kindMeta.removed.chip)}>
                <Minus className="mr-0.5 h-2.5 w-2.5" />
                {counts.removed} removed
              </Badge>
            )}
            <span className="mx-1 h-3 w-px bg-border/60" />
            <div className="flex flex-wrap gap-1">
              {changed.map((c) => (
                <span
                  key={c.key}
                  className={cn(
                    "rounded border px-1.5 py-0.5 font-mono text-[10px]",
                    kindMeta[c.kind].chip,
                  )}
                >
                  {c.key}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Diff table */}
      <div className="overflow-hidden rounded-md border border-border/60">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-8 px-2 py-2" />
              <th className="px-3 py-2 text-left font-medium">Field</th>
              <th className="px-3 py-2 text-left font-medium">Before</th>
              <th className="w-6" />
              <th className="px-3 py-2 text-left font-medium">After</th>
            </tr>
          </thead>
          <tbody>
            {classified.map(({ key: k, kind }) => {
              const b = before[k];
              const a = after[k];
              const meta = kindMeta[kind];
              const Icon = meta.icon;
              return (
                <tr key={k} className={cn("border-t border-border/40", meta.row)}>
                  <td className="px-2 py-2 text-center">
                    {kind !== "unchanged" ? (
                      <Icon
                        className={cn(
                          "mx-auto h-3 w-3",
                          kind === "added" && "text-success",
                          kind === "removed" && "text-destructive",
                          kind === "modified" && "text-warning",
                        )}
                      />
                    ) : null}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{k}</td>
                  <td
                    className={cn(
                      "px-3 py-2 font-mono",
                      kind === "modified" &&
                        "bg-destructive/10 text-destructive line-through decoration-destructive/50",
                      kind === "removed" && "bg-destructive/10 text-destructive",
                      kind === "added" && "text-muted-foreground/60",
                    )}
                  >
                    {kind === "added" ? "—" : fmt(b)}
                  </td>
                  <td className="text-center text-muted-foreground">
                    {kind === "modified" ? <ArrowRight className="mx-auto h-3 w-3" /> : null}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 font-mono",
                      kind === "modified" && "bg-success/10 text-success font-medium",
                      kind === "added" && "bg-success/10 text-success font-medium",
                      kind === "removed" && "text-muted-foreground/60",
                    )}
                  >
                    {kind === "removed" ? "—" : fmt(a)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KeyValueList({ data }: { data: Record<string, MetaValue> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground">No metadata recorded.</p>;
  }
  return (
    <dl className="grid grid-cols-[minmax(0,140px)_1fr] gap-x-4 gap-y-1.5 text-xs">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="truncate font-mono text-[11px] text-muted-foreground">{k}</dt>
          <dd className="break-words font-mono">{fmt(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AuditLogDetailDrawer({
  row,
  open,
  onOpenChange,
}: {
  row: AuditLogRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!row) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg" />
      </Sheet>
    );
  }

  const meta = row.metadata ?? {};
  const before = isPlainObject(meta.before) ? meta.before : null;
  const after = isPlainObject(meta.after) ? meta.after : null;
  const rest: Record<string, MetaValue> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (k === "before" || k === "after") continue;
    if (v === null || ["string", "number", "boolean"].includes(typeof v)) {
      rest[k] = v as MetaValue;
    } else {
      rest[k] = JSON.stringify(v);
    }
  }

  const rawJson = JSON.stringify(row, null, 2);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ScrollText className="h-4 w-4" />
            </div>
            <SheetTitle className="font-mono text-sm">{row.action}</SheetTitle>
          </div>
          <SheetDescription>
            {new Date(row.created_at).toLocaleString()}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Actor</h3>
            <div className="flex items-center gap-3 rounded-md border border-border/60 bg-card/40 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-chart-4/20 text-xs font-semibold">
                {(row.actor_name ?? row.actor_email ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.actor_name ?? "Unknown"}</p>
                <p className="truncate text-xs text-muted-foreground">{row.actor_email ?? row.user_id}</p>
              </div>
              <Badge variant="outline" className={roleStyles[row.actor_role]}>
                {row.actor_role === "admin" ? (
                  <ShieldCheck className="mr-1 h-3 w-3" />
                ) : (
                  <UserIcon className="mr-1 h-3 w-3" />
                )}
                {row.actor_role}
              </Badge>
            </div>
          </section>

          {row.entity_type ? (
            <section className="space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Entity</h3>
              <div className="rounded-md border border-border/60 bg-card/40 p-3 font-mono text-xs">
                <span className="text-muted-foreground">{row.entity_type}</span>
                {row.entity_id ? <span> · {row.entity_id}</span> : null}
              </div>
            </section>
          ) : null}

          {before && after ? (
            <section className="space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Changes</h3>
              <DiffTable before={before} after={after} />
            </section>
          ) : null}

          <section className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {before || after ? "Other metadata" : "Metadata"}
            </h3>
            <div className="rounded-md border border-border/60 bg-card/40 p-3">
              <KeyValueList data={rest} />
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Raw JSON</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(rawJson).then(() => toast.success("Copied to clipboard"));
                }}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
              </Button>
            </div>
            <pre className="max-h-80 overflow-auto rounded-md border border-border/60 bg-muted/30 p-3 text-[11px] leading-relaxed">
              {rawJson}
            </pre>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}