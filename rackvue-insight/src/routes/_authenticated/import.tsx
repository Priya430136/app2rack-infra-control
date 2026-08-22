import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useCallback } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { TopBar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { datasetsQO } from "@/lib/infra-queries";
import { importDataset, deleteDataset } from "@/lib/datasets.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/import")({ component: Page });

type Target = "servers" | "applications" | "racks";
const CANONICAL: Record<Target, string[]> = {
  servers: [
    "name",
    "hostname",
    "ip",
    "os",
    "cpu_usage",
    "memory_usage",
    "storage_tb",
    "status",
    "rack_id",
    "slot",
  ],
  applications: ["name", "owner", "env", "criticality", "deployment", "server_id", "status"],
  racks: ["name", "dc", "capacity_u", "temperature_c"],
};

function autoMap(headers: string[], fields: string[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const f of fields) {
    const lf = f.toLowerCase();
    const hit = headers.find((h) => {
      const lh = h.toLowerCase().replace(/[_\s-]/g, "");
      const lff = lf.replace(/[_\s-]/g, "");
      return lh === lff || lh.includes(lff) || lff.includes(lh);
    });
    if (hit) m[f] = hit;
  }
  return m;
}

function Page() {
  const qc = useQueryClient();
  const datasets = useQuery(datasetsQO);
  const doImport = useServerFn(importDataset);
  const doDel = useServerFn(deleteDataset);

  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<"csv" | "xlsx" | "json">("csv");
  const [target, setTarget] = useState<Target>("servers");
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);

  const importMut = useMutation({
    mutationFn: () =>
      doImport({ data: { filename: file!.name, kind, target, rows: rows as any, mapping } }),
    onSuccess: (res: any) => {
      qc.invalidateQueries();
      toast.success(
        `Imported ${res.imported} rows${res.errors?.length ? ` (${res.errors.length} errors)` : ""}`,
      );
      setFile(null);
      setRows([]);
      setHeaders([]);
      setMapping({});
    },
    onError: (e: any) => toast.error(e?.message ?? "Import failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => doDel({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["datasets"] });
      toast.success("Deleted");
    },
  });

  const handleFile = useCallback(
    async (f: File) => {
      setFile(f);
      const ext = f.name.toLowerCase().split(".").pop();
      const k: "csv" | "xlsx" | "json" =
        ext === "json" ? "json" : ext === "xlsx" || ext === "xls" ? "xlsx" : "csv";
      setKind(k);
      let parsed: Array<Record<string, unknown>> = [];
      if (k === "csv") {
        const text = await f.text();
        const r = Papa.parse<Record<string, unknown>>(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });
        parsed = r.data;
      } else if (k === "json") {
        const text = await f.text();
        const data = JSON.parse(text);
        parsed = Array.isArray(data) ? data : (data.rows ?? []);
      } else {
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        parsed = XLSX.utils.sheet_to_json(sheet);
      }
      parsed = parsed.slice(0, 5000);
      const hs = parsed.length ? Object.keys(parsed[0]) : [];
      setRows(parsed);
      setHeaders(hs);
      setMapping(autoMap(hs, CANONICAL[target]));
    },
    [target],
  );

  function onTargetChange(t: Target) {
    setTarget(t);
    if (headers.length) setMapping(autoMap(headers, CANONICAL[t]));
  }

  return (
    <>
      <TopBar
        title="Data Import Center"
        subtitle="Upload CSV, Excel, or JSON to populate your infrastructure"
      />
      <div className="space-y-6 p-6">
        <Card className="border-border/60 bg-card/60 p-6 backdrop-blur">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              className={`relative grid place-items-center rounded-lg border-2 border-dashed p-10 text-center transition ${dragOver ? "border-primary bg-primary/5" : "border-border/60 bg-background/40"}`}
            >
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Drop a file here, or click to browse</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supports CSV, XLSX, JSON · up to 5,000 rows
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {file && (
                <p className="mt-3 text-xs text-primary">
                  {file.name} · {rows.length} rows
                </p>
              )}
            </div>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Import into</Label>
                <Select value={target} onValueChange={(v) => onTargetChange(v as Target)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="servers">Servers</SelectItem>
                    <SelectItem value="applications">Applications</SelectItem>
                    <SelectItem value="racks">Racks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                disabled={!rows.length || importMut.isPending}
                onClick={() => importMut.mutate()}
              >
                {importMut.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Import {rows.length} rows
              </Button>
            </div>
          </div>
        </Card>

        {headers.length > 0 && (
          <Card className="border-border/60 bg-card/60 p-6 backdrop-blur">
            <h3 className="mb-3 text-sm font-semibold">Column mapping</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {CANONICAL[target].map((field) => (
                <div key={field} className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <Label className="text-xs">{field}</Label>
                  <Select
                    value={mapping[field] ?? "__none"}
                    onValueChange={(v) =>
                      setMapping({ ...mapping, [field]: v === "__none" ? "" : v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="(unmapped)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">(unmapped)</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <h3 className="mb-2 mt-6 text-sm font-semibold">Preview (first 10)</h3>
            <div className="overflow-x-auto rounded-md border border-border/60">
              <table className="w-full text-xs">
                <thead className="bg-background/40">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 10).map((r, i) => (
                    <tr key={i} className="border-t border-border/30">
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-1.5 font-mono">
                          {String(r[h] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Card className="border-border/60 bg-card/60 p-6 backdrop-blur">
          <h3 className="mb-3 text-sm font-semibold">Import history</h3>
          {datasets.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : !datasets.data?.length ? (
            <p className="text-xs text-muted-foreground">No imports yet.</p>
          ) : (
            <div className="space-y-2">
              {datasets.data.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-3 rounded-md border border-border/40 bg-background/30 px-3 py-2 text-xs"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{d.filename}</span>
                  <span className="rounded bg-muted/40 px-1.5 py-0.5 uppercase tracking-wider">
                    {d.kind}
                  </span>
                  <span className="text-muted-foreground">→ {d.target_entity}</span>
                  <span className="ml-auto flex items-center gap-1">
                    {d.status === "imported" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    )}
                    {d.imported_count}/{d.row_count} rows
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => delMut.mutate(d.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
