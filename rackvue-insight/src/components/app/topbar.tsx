import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Search,
  LogOut,
  Boxes,
  Server,
  Workflow,
  ArrowRight,
  X,
  Loader2,
  AlertTriangle,
  Settings as SettingsIcon,
  ShieldCheck,
  User as UserIcon,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { NotificationCenter } from "@/components/app/notification-center";
import { ScenarioSwitcher } from "@/components/app/scenario-switcher";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { applicationsQO, racksQO, serversQO } from "@/lib/infra-queries";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { clearAuthToken } from "@/lib/auth-token";

type SearchResult = {
  label: string;
  description: string;
  category: string;
  to: "/applications" | "/servers" | "/racks";
  icon: LucideIcon;
  color: string;
};

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [role, setRole] = useState<"admin" | "moderator" | "user">("user");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const appsQ = useQuery(applicationsQO);
  const serversQ = useQuery(serversQO);
  const racksQ = useQuery(racksQO);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        setSearchOpen(true);
      }
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!user) return;
    setRole("user"); // Default to user for now
  }, [user]);

  const roleLabel =
    role === "admin" ? "Admin" : role === "moderator" ? "Infrastructure Engineer" : "Member";
  const initial = (user?.displayName || user?.email || "?").charAt(0).toUpperCase();

  const results = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];

    type Server = {
      id: string;
      name?: string | null;
      hostname?: string | null;
      ip?: string | null;
      os?: string | null;
      status?: string | null;
    };
    type Application = {
      name?: string | null;
      owner?: string | null;
      env?: string | null;
      criticality?: string | null;
      deployment?: string | null;
      server_id?: string | null;
    };
    type Rack = {
      name?: string | null;
      dc?: string | null;
      capacity_u?: number | null;
      temperature_c?: number | null;
    };

    const serverById = new Map<string, Server>(
      ((serversQ.data as Server[]) ?? []).map((server) => [server.id, server]),
    );
    const matches = (...values: Array<string | number | null | undefined>) =>
      values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(term),
      );

    const appResults: SearchResult[] = ((appsQ.data as Application[]) ?? [])
      .filter((app) =>
        matches(
          app.name,
          app.owner,
          app.env,
          app.criticality,
          app.deployment,
          serverById.get(app.server_id ?? "")?.name,
        ),
      )
      .slice(0, 4)
      .map((app) => ({
        label: app.name ?? "Unknown App",
        description: `${app.env ?? "No Env"} · ${app.owner ?? "No owner"} · ${app.deployment ?? "Unassigned"}`,
        category: "Application",
        to: "/applications",
        icon: Boxes,
        color: "var(--chart-1)",
      }));

    const serverResults: SearchResult[] = ((serversQ.data as Server[]) ?? [])
      .filter((server) =>
        matches(server.name, server.hostname, server.ip, server.os, server.status),
      )
      .slice(0, 4)
      .map((server) => ({
        label: server.name ?? "Unknown Server",
        description: `${server.hostname ?? "No hostname"} · ${server.ip ?? "No IP"} · ${server.status ?? "Unknown"}`,
        category: "Server",
        to: "/servers",
        icon: Server,
        color: "var(--chart-4)",
      }));

    const rackResults: SearchResult[] = ((racksQ.data as Rack[]) ?? [])
      .filter((rack) => matches(rack.name, rack.dc, rack.capacity_u, rack.temperature_c))
      .slice(0, 4)
      .map((rack) => ({
        label: rack.name ?? "Unknown Rack",
        description: `${rack.dc ?? "No DC"} · ${rack.capacity_u ?? 0}U · ${rack.temperature_c ?? 0}°C`,
        category: "Rack",
        to: "/racks",
        icon: Workflow,
        color: "var(--chart-3)",
      }));

    return [...appResults, ...serverResults, ...rackResults].slice(0, 8);
  }, [appsQ.data, racksQ.data, searchTerm, serversQ.data]);

  const searchLoading = appsQ.isLoading || serversQ.isLoading || racksQ.isLoading;
  const searchError = appsQ.error || serversQ.error || racksQ.error;
  const trimmedTerm = searchTerm.trim();

  useEffect(() => {
    if (searchError && searchOpen && trimmedTerm) {
      toast.error("Search failed", {
        description:
          searchError instanceof Error ? searchError.message : "Unable to load inventory.",
      });
    }
  }, [searchError, searchOpen, trimmedTerm]);

  function goToResult(result: SearchResult) {
    setSearchTerm("");
    setSearchOpen(false);
    navigate({ to: result.to });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedTerm) {
      toast.message("Type to search", { description: "Enter an app, server, or rack name." });
      return;
    }
    setSearchOpen(true);
    if (searchError) {
      toast.error("Search failed", {
        description:
          searchError instanceof Error ? searchError.message : "Unable to load inventory.",
      });
      return;
    }
    if (searchLoading) {
      toast.message("Loading inventory…");
      return;
    }
    if (results[0]) {
      goToResult(results[0]);
    } else {
      toast.message("No matches", { description: `Nothing found for “${trimmedTerm}”.` });
    }
  }

  async function signOut() {
    clearAuthToken();
    toast.success("Signed out");
    navigate({ to: "/" });
  }
  return (
    <header
      className={`sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-6 backdrop-blur-2xl transition-all duration-300 ${
        scrolled
          ? "border-border/60 bg-background/85 shadow-[0_6px_28px_-14px_oklch(0.05_0.02_250/0.7)]"
          : "border-border/30 bg-background/60"
      }`}
    >
      <SidebarTrigger className="-ml-2" />
      <div className="flex flex-col leading-tight">
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <form onSubmit={submitSearch} className="relative hidden md:block">
          <button
            type="submit"
            title="Search infrastructure"
            className="absolute left-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          <Input
            ref={searchInputRef}
            placeholder="Search apps, servers, racks..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => window.setTimeout(() => setSearchOpen(false), 140)}
            className="h-9 w-72 bg-card/50 pl-10 pr-16 border-border/60"
          />
          {!searchTerm && (
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline-flex">
              <span className="text-[11px] leading-none">{isMac ? "⌘" : "Ctrl"}</span>
              <span>K</span>
            </kbd>
          )}
          {searchTerm && (
            <button
              type="button"
              title="Clear search"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {searchOpen && trimmedTerm && (
            <div className="absolute right-0 top-11 z-50 w-[28rem] overflow-hidden rounded-lg border border-border/70 bg-popover/95 shadow-[var(--shadow-card)] backdrop-blur-xl">
              <div className="border-b border-border/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Infrastructure search
                {searchLoading && !searchError && (
                  <span className="ml-2 inline-flex items-center gap-1 normal-case tracking-normal text-[10px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> loading
                  </span>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto p-2">
                {searchError ? (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-3 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium">Search unavailable</div>
                      <div className="truncate text-xs opacity-80">
                        {searchError instanceof Error
                          ? searchError.message
                          : "Failed to load inventory."}
                      </div>
                    </div>
                  </div>
                ) : searchLoading ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading inventory…
                  </div>
                ) : results.length > 0 ? (
                  results.map((result) => {
                    const Icon = result.icon;
                    return (
                      <button
                        key={`${result.category}-${result.label}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => goToResult(result)}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-accent/70"
                      >
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border"
                          style={{
                            color: result.color,
                            borderColor: `color-mix(in oklab, ${result.color} 35%, transparent)`,
                            background: `color-mix(in oklab, ${result.color} 12%, transparent)`,
                          }}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{result.label}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {result.description}
                          </span>
                        </span>
                        <span className="rounded border border-border/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {result.category}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    <div className="font-medium text-foreground">No matches</div>
                    <div className="mt-1 text-xs">
                      Nothing found for “{trimmedTerm}”. Try an app, server, or rack name.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
        <NotificationCenter />
        <ScenarioSwitcher />
        <div className="hidden h-9 items-center gap-2 rounded-md border border-border/60 bg-card/50 px-3 lg:flex">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium">Live</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              title="Account"
              className="flex h-9 items-center gap-2 rounded-md border border-border/60 bg-card/50 pl-1 pr-2 transition hover:bg-card"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-chart-4 text-xs font-semibold text-primary-foreground">
                  {initial}
                </div>
              )}
              <span className="hidden max-w-[8rem] truncate text-xs font-medium sm:inline">
                {user?.displayName ?? "Account"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 border-border/60 bg-popover/95 backdrop-blur-xl"
          >
            <DropdownMenuLabel className="flex items-start gap-3 py-3">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-chart-4 text-sm font-semibold text-primary-foreground">
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user?.displayName ?? "Loading…"}</p>
                <p className="truncate text-[11px] font-normal text-muted-foreground">
                  {user?.email ?? ""}
                </p>
                <Badge
                  variant={role === "admin" ? "default" : "outline"}
                  className="mt-1.5 gap-1 text-[10px]"
                >
                  {role === "user" ? (
                    <UserIcon className="h-2.5 w-2.5" />
                  ) : (
                    <ShieldCheck className="h-2.5 w-2.5" />
                  )}
                  {roleLabel}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">
                <SettingsIcon className="mr-2 h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                signOut();
              }}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
