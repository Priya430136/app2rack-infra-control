import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: string;
  trend?: "up" | "down" | "flat";
  accent?: "primary" | "success" | "warning" | "destructive";
}

const accentMap = {
  primary: "from-primary/20 to-primary/0 text-primary",
  success: "from-success/20 to-success/0 text-success",
  warning: "from-warning/20 to-warning/0 text-warning",
  destructive: "from-destructive/20 to-destructive/0 text-destructive",
};

export function StatCard({ label, value, icon: Icon, delta, trend, accent = "primary" }: Props) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/60 p-5 backdrop-blur">
      <div className={cn("absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-radial opacity-60 blur-2xl bg-gradient-to-br", accentMap[accent])} />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {delta && (
            <p className={cn("text-xs font-medium", {
              "text-success": trend === "up",
              "text-destructive": trend === "down",
              "text-muted-foreground": trend === "flat",
            })}>{delta}</p>
          )}
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-lg border border-border/60 bg-background/40", accentMap[accent].split(" ").pop())}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
