import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { alerts, levelStyles, type Alert } from "@/lib/alerts";
import { toast } from "sonner";

export function AlertBanner() {
  const critical = alerts.filter((a) => a.level === "critical");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible: Alert[] = critical.filter((a) => !dismissed.has(a.id)).slice(0, 3);

  useEffect(() => {
    // Fire a toast for each critical alert once on mount
    critical.slice(0, 3).forEach((a, idx) => {
      setTimeout(() => {
        toast.error(a.title, { description: a.description, duration: 6000 });
      }, 400 + idx * 600);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible.length) return null;

  return (
    <div className="space-y-2">
      {visible.map((a) => {
        const s = levelStyles[a.level];
        const Icon = a.icon;
        return (
          <div key={a.id}
            className={`flex items-start gap-3 rounded-lg border ${s.border} ${s.bg} px-4 py-3 backdrop-blur`}>
            <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-md border ${s.border} bg-background/50`}>
              <Icon className={`h-4 w-4 ${s.text}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-semibold ${s.text}`}>{a.title}</p>
                <span className="rounded border border-border/60 bg-background/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{a.source}</span>
                <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">{a.time}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
            </div>
            <button onClick={() => setDismissed((p) => new Set(p).add(a.id))}
              className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-background/60 hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}