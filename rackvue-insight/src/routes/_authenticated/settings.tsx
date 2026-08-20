import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { TopBar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import api from "@/lib/api";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { mySubscriptionQO, myWalletQO, myInvoicesQO, plansQO } from "@/lib/billing-queries";
import { Zap, Calendar, CreditCard, ShieldCheck, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({ component: Page });

function Page() {
  const { user, loading } = useCurrentUser();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<string>("user");

  const subQ = useQuery(mySubscriptionQO);
  const walletQ = useQuery(myWalletQO);
  const invQ = useQuery(myInvoicesQO);
  const plansQ = useQuery(plansQO);
  const sub = subQ.data;
  const wallet = walletQ.data;
  const plan = plansQ.data?.find((p) => p.code === sub?.plan_code);
  const latestInvoice = invQ.data?.[0];
  const pct = wallet && wallet.monthly_allowance > 0
    ? Math.min(100, Math.round((wallet.balance / wallet.monthly_allowance) * 100))
    : 0;
  const canManageBilling = role === "admin" || role === "moderator";
  const roleLabel = role === "admin" ? "Admin" : role === "moderator" ? "Infrastructure Engineer" : "User";

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setRole("user"); // Default to user for now
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      await api.post("/auth/update-profile", { display_name: displayName });
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar title="Settings" subtitle="System preferences and integrations" />
      <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/60 p-6 backdrop-blur lg:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Subscription</h3>
                {role === "admin" && (
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Your current plan, credits, and latest invoice</p>
            </div>
            {canManageBilling ? (
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline"><Link to="/billing">Manage</Link></Button>
                <Button asChild size="sm" className="bg-gradient-to-r from-primary to-chart-4">
                  <Link to="/billing/pricing">Change plan</Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Admins or Infrastructure Engineers only</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => toast.info("Ask an Admin or Infrastructure Engineer to change your subscription plan.")}
                >
                  Request change
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-md border border-border/60 bg-background/40 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Plan</p>
              <p className="mt-1 text-lg font-bold capitalize">{plan?.name ?? sub?.plan_code ?? "Free"}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant={sub?.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">
                  {sub?.status ?? "active"}
                </Badge>
                {sub?.cancel_at_period_end && (
                  <Badge variant="destructive" className="text-[10px]">Cancels soon</Badge>
                )}
              </div>
            </div>

            <div className="rounded-md border border-border/60 bg-background/40 p-3">
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Zap className="h-3 w-3" /> Credits
              </p>
              <p className="mt-1 text-lg font-bold">{wallet?.balance ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">of {wallet?.monthly_allowance ?? 0} · {pct}%</p>
            </div>

            <div className="rounded-md border border-border/60 bg-background/40 p-3">
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-3 w-3" /> Renewal
              </p>
              <p className="mt-1 text-sm font-medium">
                {sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}
              </p>
              <p className="text-[10px] capitalize text-muted-foreground">{sub?.billing_cycle ?? "monthly"}</p>
            </div>

            <div className="rounded-md border border-border/60 bg-background/40 p-3">
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                <CreditCard className="h-3 w-3" /> Latest invoice
              </p>
              {latestInvoice ? (
                <>
                  <p className="mt-1 text-sm font-medium">${Number(latestInvoice.amount).toFixed(2)}</p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] capitalize">{latestInvoice.status}</Badge>
                    <span>{new Date(latestInvoice.created_at).toLocaleDateString()}</span>
                  </div>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">No invoices</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="border-border/60 bg-card/60 p-6 backdrop-blur">
          <h3 className="text-sm font-semibold">Profile</h3>
          <p className="mb-4 text-xs text-muted-foreground">Your operations identity</p>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Display Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={loading ? "Loading..." : "Your name"}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={email} disabled className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Input value={roleLabel} disabled className="mt-1.5" />
            </div>
            <Button size="sm" onClick={save} disabled={saving || loading || !user}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </Card>

        <Card className="border-border/60 bg-card/60 p-6 backdrop-blur">
          <h3 className="text-sm font-semibold">Notifications</h3>
          <p className="mb-4 text-xs text-muted-foreground">Alert routing preferences</p>
          <div className="space-y-4">
            {[
              ["Critical incidents", true],
              ["Server downtime", true],
              ["High CPU alerts", true],
              ["Rack temperature warnings", true],
              ["Deployment events", false],
              ["Weekly summary email", true],
            ].map(([label, on]) => (
              <div key={label as string} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <Switch defaultChecked={on as boolean} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-border/60 bg-card/60 p-6 backdrop-blur lg:col-span-2">
          <h3 className="text-sm font-semibold">Integrations</h3>
          <p className="mb-4 text-xs text-muted-foreground">Connected systems</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {["Prometheus", "Grafana", "PagerDuty", "Slack", "Datadog", "ServiceNow"].map((n) => (
              <div key={n} className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{n}</p>
                  <p className="text-[10px] text-muted-foreground">Connected</p>
                </div>
                <span className="h-2 w-2 rounded-full bg-success" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
