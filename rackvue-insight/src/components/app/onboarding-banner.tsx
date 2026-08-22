import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Sparkles, Upload, Loader2, X, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { seedDemoData } from "@/lib/infra.functions";

export function OnboardingBanner({ onDone }: { onDone: () => void }) {
  const seed = useServerFn(seedDemoData);
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function handleSeed() {
    setLoading(true);
    try {
      const r = await seed();
      if ((r as { seeded?: boolean }).seeded) toast.success("Demo data loaded");
      else toast.info("You already have data");
      qc.invalidateQueries();
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to seed data");
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    toast.success("You're all set — bring your own data anytime");
    onDone();
  }

  return (
    <div className="border-b border-border/60 bg-gradient-to-r from-primary/8 via-chart-4/8 to-transparent backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
            <Database className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">
              Welcome to App2Rack — how would you like to start?
            </div>
            <div className="text-xs text-muted-foreground">
              Load a realistic demo fleet to explore the console, or bring your own infrastructure
              data.
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleSeed}
            disabled={loading}
            size="sm"
            className="bg-gradient-to-r from-primary to-chart-4 text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            {loading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            Seed demo data
          </Button>
          <Button asChild variant="outline" size="sm" onClick={handleSkip}>
            <Link to="/import">
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Bring my own data
            </Link>
          </Button>
          <Button onClick={handleSkip} variant="ghost" size="sm" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
