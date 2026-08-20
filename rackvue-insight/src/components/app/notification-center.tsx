import { Bell, CheckCheck, X, Zap, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { alerts as seed, levelStyles, type Alert } from "@/lib/alerts";
import { useState } from "react";
import { toast } from "sonner";
import { notifyAlert, notifyAlerts, resetSessionNotifications } from "@/lib/notifications";
import { useNavigate } from "@tanstack/react-router";

export function NotificationCenter() {
  const [items, setItems] = useState<Alert[]>(seed);
  const unread = items.length;
  const navigate = useNavigate();

  function dismiss(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }
  function clearAll() {
    setItems([]);
    toast.success("All notifications cleared");
  }

  function triggerSample() {
    // Dev control: force-fire a representative mix to verify display + timing.
    const sample: Alert[] = [
      seed.find((a) => a.level === "critical"),
      seed.find((a) => a.level === "warning"),
      seed.find((a) => a.level === "info"),
    ].filter(Boolean) as Alert[];
    if (!sample.length) {
      toast.info("No sample alerts available");
      return;
    }
    notifyAlerts(sample, { force: true, navigate: (o) => navigate(o as never) });
  }

  function resetDedupe() {
    resetSessionNotifications();
    toast.success("Notification dedupe reset", { description: "Non-critical alerts will fire again." });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative grid h-9 w-9 place-items-center rounded-md border border-border/60 bg-card/50 transition hover:bg-card">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 border-border/60 bg-popover/95 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">{unread} active alert{unread === 1 ? "" : "s"}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearAll} disabled={!unread} className="h-7 text-xs">
            <CheckCheck className="mr-1 h-3 w-3" />Clear
          </Button>
        </div>
        <ScrollArea className="h-[420px]">
          {items.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center text-xs text-muted-foreground">
              <Bell className="mb-2 h-6 w-6 opacity-40" />
              You're all caught up.
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {items.map((a) => {
                const s = levelStyles[a.level];
                const Icon = a.icon;
                return (
                  <li key={a.id} className={`group flex gap-3 px-4 py-3 hover:bg-card/60`}>
                    <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border ${s.border} ${s.bg}`}>
                      <Icon className={`h-4 w-4 ${s.text}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{a.title}</p>
                        <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.description}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/80">
                        <span className="font-mono">{a.source}</span>
                        <span>·</span>
                        <span>{a.time}</span>
                        <button
                          onClick={() => notifyAlert(a, { force: true, navigate: (o) => navigate(o as never) })}
                          className="ml-auto rounded border border-border/60 px-1.5 py-0.5 text-[9px] font-medium normal-case tracking-normal text-muted-foreground hover:bg-card hover:text-foreground"
                          title="Re-fire this notification as a toast"
                        >
                          Test toast
                        </button>
                      </div>
                    </div>
                    <button onClick={() => dismiss(a.id)} title="Dismiss"
                      className="opacity-0 transition group-hover:opacity-100">
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
        <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Dev tools</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={resetDedupe} className="h-7 text-xs">
              <RotateCcw className="mr-1 h-3 w-3" />Reset
            </Button>
            <Button variant="outline" size="sm" onClick={triggerSample} className="h-7 text-xs">
              <Zap className="mr-1 h-3 w-3" />Trigger sample
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}