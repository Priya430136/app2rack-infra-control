import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mySubscriptionQO, myInvoicesQO, plansQO, myWalletQO } from "@/lib/billing-queries";
import { cancelSubscription } from "@/lib/billing.functions";
import { CreditCard, Download, Calendar, Zap, Printer } from "lucide-react";
import { toast } from "sonner";
import { downloadReceipt, printReceipt } from "@/lib/receipt";

export const Route = createFileRoute("/_authenticated/billing/")({ component: BillingPage });

function BillingPage() {
  const subQ = useQuery(mySubscriptionQO);
  const invQ = useQuery(myInvoicesQO);
  const plansQ = useQuery(plansQO);
  const walletQ = useQuery(myWalletQO);
  const qc = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: async () => { await qc.invalidateQueries(); toast.success("Subscription set to cancel at period end"); },
  });

  const sub = subQ.data;
  const plan = plansQ.data?.find((p) => p.code === sub?.plan_code);
  const wallet = walletQ.data;

  return (
    <>
      <TopBar title="Billing" subtitle="Manage your subscription and invoices" />
      <div className="p-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60 p-6 backdrop-blur">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Current Plan</p>
              <h2 className="mt-1 text-2xl font-bold capitalize">{plan?.name ?? "Free"}</h2>
              <Badge className="mt-2" variant={sub?.status === "active" ? "default" : "secondary"}>{sub?.status ?? "active"}</Badge>
              {sub?.cancel_at_period_end && <Badge variant="destructive" className="ml-2">Cancels at period end</Badge>}
            </div>
            <Button asChild className="bg-gradient-to-r from-primary to-chart-4"><Link to="/billing/pricing">Change Plan</Link></Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 border-t border-border/40 pt-4">
            <div><p className="text-xs text-muted-foreground">Billing Cycle</p><p className="font-medium capitalize">{sub?.billing_cycle ?? "monthly"}</p></div>
            <div><p className="text-xs text-muted-foreground">Renewal Date</p><p className="font-medium">{sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Subscription ID</p><p className="truncate font-mono text-xs">{sub?.id ?? "—"}</p></div>
          </div>
        </Card>

        <Card className="border-border/60 bg-card/60 p-6 backdrop-blur">
          <div className="mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-warning" /><h3 className="text-sm font-semibold">AI Credits</h3></div>
          <p className="text-3xl font-bold">{wallet?.balance ?? 0}</p>
          <p className="mb-3 text-xs text-muted-foreground">of {wallet?.monthly_allowance ?? 0} monthly</p>
          <Button asChild size="sm" variant="outline" className="w-full"><Link to="/billing/credits">Manage Credits</Link></Button>
        </Card>

        <Card className="lg:col-span-3 border-border/60 bg-card/60 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-border/60 p-4">
            <CreditCard className="h-4 w-4" /><h3 className="text-sm font-semibold">Payment Method</h3>
          </div>
          <div className="p-6">
            <p className="text-sm">Mock payment provider · <span className="text-muted-foreground">Ending in 4242</span></p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => toast.info("Payment method update coming with Stripe integration")}>Update</Button>
          </div>
        </Card>

        <Card className="lg:col-span-3 border-border/60 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between border-b border-border/60 p-4">
            <h3 className="text-sm font-semibold">Invoices</h3>
            <span className="text-xs text-muted-foreground">{invQ.data?.length ?? 0} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="p-3 text-left">Invoice</th><th className="p-3 text-left">Date</th><th className="p-3 text-left">Amount</th><th className="p-3 text-left">Status</th><th className="p-3" /></tr>
              </thead>
              <tbody>
                {(invQ.data ?? []).map((inv) => (
                  <tr key={inv.id} className="border-t border-border/40">
                    <td className="p-3 font-mono text-xs">{inv.number}</td>
                    <td className="p-3"><Calendar className="mr-1 inline h-3 w-3" />{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="p-3">${Number(inv.amount).toFixed(2)}</td>
                    <td className="p-3"><Badge>{inv.status}</Badge></td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" title="Download receipt" onClick={() => downloadReceipt({
                          number: inv.number,
                          date: new Date(inv.created_at).toLocaleString(),
                          amount: Number(inv.amount),
                          currency: "USD",
                          plan: plan?.name,
                          cycle: sub?.billing_cycle ?? undefined,
                          periodStart: inv.period_start ? new Date(inv.period_start).toLocaleDateString() : undefined,
                          periodEnd: inv.period_end ? new Date(inv.period_end).toLocaleDateString() : undefined,
                          status: inv.status,
                        })}><Download className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" title="Print / Save PDF" onClick={() => printReceipt({
                          number: inv.number,
                          date: new Date(inv.created_at).toLocaleString(),
                          amount: Number(inv.amount),
                          currency: "USD",
                          plan: plan?.name,
                          cycle: sub?.billing_cycle ?? undefined,
                          periodStart: inv.period_start ? new Date(inv.period_start).toLocaleDateString() : undefined,
                          periodEnd: inv.period_end ? new Date(inv.period_end).toLocaleDateString() : undefined,
                          status: inv.status,
                        })}><Printer className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!invQ.data || invQ.data.length === 0) && (
                  <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">No invoices yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {sub?.plan_code !== "free" && !sub?.cancel_at_period_end && (
          <Card className="lg:col-span-3 border-destructive/30 bg-destructive/5 p-6">
            <h3 className="mb-1 text-sm font-semibold text-destructive">Cancel Subscription</h3>
            <p className="mb-3 text-xs text-muted-foreground">Your plan will remain active until the end of the billing period.</p>
            <Button variant="destructive" size="sm" onClick={() => cancel.mutate()} disabled={cancel.isPending}>Cancel Subscription</Button>
          </Card>
        )}
      </div>
    </>
  );
}