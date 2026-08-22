import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { seedDemoData } from "@/lib/infra.functions";
import { Database, Sparkles, Upload, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function EmptyState({ entity }: { entity: string }) {
  const seed = useServerFn(seedDemoData);
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function doSeed() {
    setLoading(true);
    try {
      const r = await seed();
      if ((r as any).seeded) toast.success("Demo data loaded — refreshing…");
      else toast.info("You already have data.");
      qc.invalidateQueries();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to seed data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-dashed border-border/60 bg-card/40 p-10 text-center backdrop-blur">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
        <Database className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold">No {entity} yet</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Start by seeding a realistic demo dataset, importing your own CSV/XLSX/JSON, or creating a
        record manually.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={doSeed} disabled={loading} size="sm">
          {loading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          )}
          Seed demo data
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/import">
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Import dataset
          </Link>
        </Button>
      </div>
    </Card>
  );
}
