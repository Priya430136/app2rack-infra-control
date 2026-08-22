import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur overflow-hidden">
      <div className="border-b border-border/60 bg-background/30 px-4 py-3">
        <div className="flex gap-6">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3 flex-1 animate-pulse rounded bg-muted/60" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border/40">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-6 px-4 py-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className={cn(
                  "h-3 flex-1 animate-pulse rounded bg-muted/50",
                  c === 0 && "max-w-[8rem]",
                )}
                style={{ animationDelay: `${(r * cols + c) * 40}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CardGridSkeleton({ count = 6, minH = 180 }: { count?: number; minH?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          className="border-border/60 bg-card/60 p-5 backdrop-blur"
          style={{ minHeight: minH }}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-md bg-muted/60" />
            <div className="flex-1 space-y-2">
              <div
                className="h-3 w-24 animate-pulse rounded bg-muted/60"
                style={{ animationDelay: `${i * 60}ms` }}
              />
              <div
                className="h-2.5 w-16 animate-pulse rounded bg-muted/40"
                style={{ animationDelay: `${i * 60 + 80}ms` }}
              />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, k) => (
              <div key={k} className="space-y-1.5">
                <div
                  className="h-2 w-10 animate-pulse rounded bg-muted/40"
                  style={{ animationDelay: `${(i * 4 + k) * 50}ms` }}
                />
                <div
                  className="h-3 w-full animate-pulse rounded bg-muted/60"
                  style={{ animationDelay: `${(i * 4 + k) * 50 + 40}ms` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-5 h-2 w-full animate-pulse rounded bg-muted/50" />
        </Card>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border/60 bg-card/60 p-4 backdrop-blur">
          <div className="flex items-start gap-4">
            <div
              className="h-9 w-9 animate-pulse rounded-md bg-muted/60"
              style={{ animationDelay: `${i * 60}ms` }}
            />
            <div className="flex-1 space-y-2">
              <div
                className="h-3 w-2/3 animate-pulse rounded bg-muted/60"
                style={{ animationDelay: `${i * 60 + 40}ms` }}
              />
              <div
                className="h-2.5 w-1/3 animate-pulse rounded bg-muted/40"
                style={{ animationDelay: `${i * 60 + 80}ms` }}
              />
            </div>
            <div className="h-6 w-16 animate-pulse rounded bg-muted/40" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retrying,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <Card className="border-destructive/30 bg-destructive/5 p-8 text-center backdrop-blur">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-lg bg-destructive/15 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {message ?? "We couldn't load this data. Check your connection and try again."}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={retrying}
          size="sm"
          variant="outline"
          className="mt-4 gap-1.5"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", retrying && "animate-spin")} />
          {retrying ? "Retrying…" : "Try again"}
        </Button>
      )}
    </Card>
  );
}
