import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/sidebar";
import { InfraBotWidget } from "@/components/app/infrabot-widget";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { alerts } from "@/lib/alerts";
import { notifyAlerts } from "@/lib/notifications";
import { useRealtimeInvalidate } from "@/hooks/use-realtime-invalidate";
import { OnboardingBanner } from "@/components/app/onboarding-banner";
import { applicationsQO, serversQO, racksQO } from "@/lib/infra-queries";
import { ScenarioBanner } from "@/components/app/scenario-switcher";
import { bootstrapScenario } from "@/lib/demo-scenario-store";
import api from "@/lib/api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  useRealtimeInvalidate();

  useEffect(() => { bootstrapScenario(qc); }, [qc]);

  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const serversQ = useQuery({ ...serversQO, enabled: authReady });
  const racksQ = useQuery({ ...racksQO, enabled: authReady });
  const appsQ = useQuery({ ...applicationsQO, enabled: authReady });

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate({ to: "/login", search: { redirect: window.location.pathname }, replace: true });
      return;
    }

    api.get("/auth/me").then(({ data }) => {
      if (!active) return;
      
      const userData = data.data;
      if (!userData) {
        localStorage.removeItem('token');
        navigate({ to: "/login", search: { redirect: window.location.pathname }, replace: true });
        return;
      }
      
      const id = userData.id;
      setUserId(id);
      setAuthReady(true);
      if (id && typeof window !== "undefined") {
        setAcknowledged(localStorage.getItem(`a2r:onboarded:${id}`) === "1");
      }
    }).catch(() => {
      if (!active) return;
      localStorage.removeItem('token');
      navigate({ to: "/login", search: { redirect: window.location.pathname }, replace: true });
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  const loaded = !serversQ.isLoading && !racksQ.isLoading && !appsQ.isLoading;
  const hasData =
    (serversQ.data?.length ?? 0) + (racksQ.data?.length ?? 0) + (appsQ.data?.length ?? 0) > 0;
  const showBanner = !!userId && loaded && !hasData && !acknowledged;
  const notificationsReady = !!userId && loaded && (hasData || acknowledged);

  useEffect(() => {
    if (!notificationsReady) return;
    notifyAlerts(alerts.slice(0, 6), { navigate: (o) => navigate(o as never) });
  }, [notificationsReady, navigate]);

  function acknowledge() {
    if (userId && typeof window !== "undefined") {
      localStorage.setItem(`a2r:onboarded:${userId}`, "1");
    }
    setAcknowledged(true);
  }

  if (!authReady) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset className="grid flex-1 place-items-center bg-transparent">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading secure workspace…
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="min-w-0 flex-1 overflow-x-clip bg-transparent">
          <ScenarioBanner />
          {showBanner && <OnboardingBanner onDone={acknowledge} />}
          <Outlet />
        </SidebarInset>
      </div>
      <InfraBotWidget />
    </SidebarProvider>
  );
}
