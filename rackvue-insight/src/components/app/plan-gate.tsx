import { useQuery } from "@tanstack/react-query";
import { mySubscriptionQO } from "@/lib/billing-queries";
import { planHasFeature, type FeatureCode } from "@/lib/credit-costs";
import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function PlanGate({ feature, children }: { feature: FeatureCode; children: ReactNode }) {
  const { data: sub, isLoading } = useQuery(mySubscriptionQO);
  const plan = sub?.plan_code ?? "free";
  const allowed = planHasFeature(plan, feature);
  if (isLoading || allowed) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-40">{children}</div>
      <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-border/60 bg-card/90 p-6 text-center backdrop-blur-xl shadow-2xl">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-chart-4/20">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">Premium Feature</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            This feature is available in the Pro plan and above.
          </p>
          <div className="flex justify-center gap-2">
            <Button asChild size="sm" className="bg-gradient-to-r from-primary to-chart-4">
              <Link to="/billing/pricing">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Upgrade Now
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/billing/pricing">Compare Plans</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
