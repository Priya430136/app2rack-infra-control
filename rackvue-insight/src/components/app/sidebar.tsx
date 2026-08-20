import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Boxes, Server, Network, AlertTriangle,
  BarChart3, Settings, Workflow, Activity, Calculator, HardDrive, Cloud, Bot, Upload, TerminalSquare, Sparkles, CreditCard, Zap, Tag, LineChart, ScrollText,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

const activeCls =
  "relative bg-gradient-to-r from-primary/20 to-chart-4/10 text-primary font-medium " +
  "before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r " +
  "before:bg-gradient-to-b before:from-primary before:to-chart-4 before:shadow-[0_0_8px_hsl(var(--primary)/0.6)] " +
  "hover:bg-gradient-to-r hover:from-primary/25 hover:to-chart-4/15 hover:text-primary " +
  "data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/20 data-[active=true]:to-chart-4/10 data-[active=true]:text-primary";

const nav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Applications", url: "/applications", icon: Boxes },
  { title: "Servers", url: "/servers", icon: Server },
  { title: "Racks", url: "/racks", icon: Workflow },
  { title: "Mapping", url: "/mapping", icon: Network },
  { title: "Incidents", url: "/incidents", icon: AlertTriangle },
  { title: "AI Log Analyzer", url: "/log-analyzer", icon: TerminalSquare },
  { title: "AI Optimization Advisor", url: "/optimization-advisor", icon: Sparkles },
  { title: "Data Import", url: "/import", icon: Upload },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Audit Logs", url: "/audit-logs", icon: ScrollText },
  { title: "Settings", url: "/settings", icon: Settings },
] as const;

const tools = [
  { title: "Storage Sizing", url: "/calculators/storage", icon: HardDrive },
  { title: "Rack Capacity", url: "/calculators/rack", icon: Calculator },
  { title: "Cloud Cost", url: "/calculators/cloud", icon: Cloud },
] as const;

const billing = [
  { title: "Pricing", url: "/billing/pricing", icon: Tag },
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "AI Credits", url: "/billing/credits", icon: Zap },
  { title: "Usage Analytics", url: "/billing/usage", icon: LineChart },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useCurrentUser();
  const initial = (user?.displayName || user?.email || "?").charAt(0).toUpperCase();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/60 px-4 py-4">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-chart-4 shadow-[var(--shadow-glow)]">
            <Activity className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight">App2Rack</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Infra Control</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const active = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title} className={cn(active && activeCls)}>
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className={cn("h-4 w-4", active && "text-primary")} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
            Calculators
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title} className={cn(active && activeCls)}>
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className={cn("h-4 w-4", active && "text-primary")} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
        <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
          Billing & Subscription
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {billing.map((item) => {
              const active = item.url === "/billing"
                ? pathname === "/billing"
                : pathname === item.url || pathname.startsWith(item.url + "/");
              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={active} tooltip={item.title} className={cn(active && activeCls)}>
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className={cn("h-4 w-4", active && "text-primary")} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60 p-3">
        <div className="flex items-center gap-3 rounded-md bg-sidebar-accent/50 px-2.5 py-2 group-data-[collapsible=icon]:hidden">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-chart-4 to-primary text-xs font-semibold text-primary-foreground">
              {initial}
            </div>
          )}
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-xs font-medium">{user?.displayName ?? "Loading..."}</span>
            <span className="truncate text-[10px] text-muted-foreground">{user?.email ?? ""}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
