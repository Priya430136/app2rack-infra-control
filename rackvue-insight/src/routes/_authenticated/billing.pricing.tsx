import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { TopBar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { plansQO, mySubscriptionQO } from "@/lib/billing-queries";
import { mockCheckout } from "@/lib/billing.functions";
import { Check, Sparkles, Star, Building2, Rocket, CreditCard, Smartphone, Landmark, Wallet, Lock, CheckCircle2, Loader2, ArrowLeft, ShieldCheck, Download, Printer } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { z } from "zod";
import { downloadReceipt, printReceipt, type ReceiptData } from "@/lib/receipt";

const pricingSearchSchema = z.object({
  checkout: z.enum(["free", "pro", "business", "enterprise"]).optional(),
  cycle: z.enum(["monthly", "yearly"]).optional(),
});

export const Route = createFileRoute("/_authenticated/billing/pricing")({
  component: PricingPage,
  validateSearch: (s) => pricingSearchSchema.parse(s),
});

const PLAN_ICONS: Record<string, typeof Rocket> = {
  free: Star, pro: Rocket, business: Building2, enterprise: Sparkles,
};

const FEATURE_LABELS: Record<string, string> = {
  dashboard: "Dashboard", ai_chat: "AI Chat", basic_reports: "Basic Reports",
  community_support: "Community Support", unlimited_infra: "Unlimited Servers, Racks & Apps",
  log_analyzer: "AI Log Analyzer", rca: "AI Root Cause Analysis",
  optimization_advisor: "AI Infrastructure Optimization Advisor",
  ai_reports: "AI Reports", pdf_export: "PDF Export",
  email_notifications: "Email Notifications", priority_support: "Priority Support",
  multi_team: "Multi-Team Workspaces", rbac: "Role Based Access Control",
  audit_logs: "Audit Logs", api_access: "API Access", webhooks: "Webhooks",
  advanced_analytics: "Advanced Analytics", unlimited_reports: "Unlimited Reports",
  custom_dashboards: "Custom Dashboards", unlimited_chat: "Unlimited AI Chat",
  unlimited_everything: "Unlimited Everything", unlimited_credits: "Unlimited AI Credits",
  dedicated_models: "Dedicated AI Models", sso: "SSO", white_label: "White Label",
  dedicated_infra: "Dedicated Infrastructure", sla: "SLA", csm: "Dedicated CSM",
  on_prem: "On-Prem Deployment",
};

function PricingPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(search.cycle === "yearly");
  const plansQ = useQuery(plansQO);
  const subQ = useQuery(mySubscriptionQO);
  const qc = useQueryClient();
  const checkout = useMutation({
    mutationFn: (v: { plan_code: "free"|"pro"|"business"|"enterprise"; cycle: "monthly"|"yearly" }) =>
      mockCheckout({ data: v }),
    onSuccess: async () => {
      await qc.invalidateQueries();
      toast.success("Plan activated!");
      navigate({ to: "/billing" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Checkout failed"),
  });

  const plans = plansQ.data ?? [];
  const currentPlan = subQ.data?.plan_code ?? "free";

  type PlanCode = "free" | "pro" | "business" | "enterprise";
  const [payOpen, setPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<{ plan: PlanCode; cycle: "monthly"|"yearly"; price: number; name: string } | null>(null);

  function startCheckout(plan: PlanCode, name: string, priceMonthly: number, priceYearly: number) {
    if (plan === "free") {
      checkout.mutate({ plan_code: plan, cycle: yearly ? "yearly" : "monthly" });
      return;
    }
    const price = yearly ? priceYearly : priceMonthly;
    setPayTarget({ plan, cycle: yearly ? "yearly" : "monthly", price, name });
    setPayOpen(true);
  }

  // Auto-trigger checkout when arriving via ?checkout=<plan> (e.g. from landing page).
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current) return;
    if (!search.checkout) return;
    if (subQ.isLoading) return;
    autoRan.current = true;
    const target = search.checkout;
    if (target === "enterprise") {
      toast.info("Sales will reach out shortly.");
    } else if (target === currentPlan) {
      toast.info(`You're already on the ${target} plan.`);
    } else {
      checkout.mutate({ plan_code: target, cycle: search.cycle === "yearly" ? "yearly" : "monthly" });
    }
    navigate({ to: "/billing/pricing", search: {}, replace: true });
  }, [search.checkout, search.cycle, subQ.isLoading, currentPlan, checkout, navigate]);

  return (
    <>
      <TopBar title="Pricing" subtitle="Choose the plan that fits your infrastructure" />
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm ${!yearly ? "font-semibold" : "text-muted-foreground"}`}>Monthly</span>
          <Switch checked={yearly} onCheckedChange={setYearly} />
          <span className={`text-sm ${yearly ? "font-semibold" : "text-muted-foreground"}`}>Yearly</span>
          <Badge className="bg-gradient-to-r from-success/20 to-primary/20 text-success border-success/40">Save 20%</Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p, i) => {
            const Icon = PLAN_ICONS[p.code] ?? Star;
            const isCurrent = currentPlan === p.code;
            const isEnterprise = p.code === "enterprise";
            const price = yearly ? p.price_yearly : p.price_monthly;
            const displayPrice = isEnterprise ? "Custom" : p.code === "free" ? "Free" : `$${yearly ? (p.price_yearly / 12).toFixed(0) : p.price_monthly}`;
            const features = (p.features as string[]) ?? [];
            return (
              <motion.div key={p.code} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className={`relative h-full overflow-hidden border-border/60 bg-card/60 p-6 backdrop-blur transition-all hover:scale-[1.02] hover:shadow-2xl ${p.is_popular ? "border-primary/60 shadow-[var(--shadow-glow)]" : ""}`}>
                  {p.is_popular && (
                    <div className="absolute right-0 top-0 rounded-bl-lg bg-gradient-to-r from-primary to-chart-4 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                      Most Popular
                    </div>
                  )}
                  {p.code === "business" && (
                    <div className="absolute right-0 top-0 rounded-bl-lg bg-gradient-to-r from-warning to-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                      Best for Growing Teams
                    </div>
                  )}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-chart-4/20">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">{p.name}</h3>
                  </div>
                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{displayPrice}</span>
                    {!isEnterprise && p.code !== "free" && <span className="text-sm text-muted-foreground">/mo</span>}
                  </div>
                  {yearly && !isEnterprise && p.code !== "free" && (
                    <p className="mb-4 text-xs text-muted-foreground">${price}/year, billed annually</p>
                  )}
                  <p className="mb-4 text-xs text-muted-foreground">
                    {p.monthly_credits === -1 ? "Unlimited AI credits" : `${p.monthly_credits} AI credits/month`}
                  </p>
                  <ul className="mb-6 space-y-2">
                    {p.max_servers != null && (
                      <li className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 text-success" />Up to {p.max_servers} servers</li>
                    )}
                    {p.max_racks != null && (
                      <li className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 text-success" />Up to {p.max_racks} racks</li>
                    )}
                    {p.max_applications != null && (
                      <li className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 text-success" />Up to {p.max_applications} applications</li>
                    )}
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 text-success" />{FEATURE_LABELS[f] ?? f}
                      </li>
                    ))}
                  </ul>
                  {isEnterprise ? (
                    <Button className="w-full" variant="outline" onClick={() => toast.info("Sales will reach out shortly.")}>Contact Sales</Button>
                  ) : isCurrent ? (
                    <Button className="w-full" variant="secondary" disabled>Current Plan</Button>
                  ) : (
                    <Button
                      className={`w-full ${p.is_popular ? "bg-gradient-to-r from-primary to-chart-4" : ""}`}
                      onClick={() => startCheckout(p.code as PlanCode, p.name, p.price_monthly, p.price_yearly)}
                      disabled={checkout.isPending}
                    >
                      {p.code === "free" ? "Get Started" : "Upgrade"}
                    </Button>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        <ComparisonTable plans={plans} />

        <div className="text-center text-sm text-muted-foreground">
          Need help? <Link to="/billing" className="text-primary hover:underline">View your billing details</Link>
        </div>
      </div>
      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        target={payTarget}
        pending={checkout.isPending}
        onConfirm={() => {
          if (!payTarget) return;
          checkout.mutate(
            { plan_code: payTarget.plan, cycle: payTarget.cycle },
            { onSuccess: () => setPayOpen(false) },
          );
        }}
      />
    </>
  );
}

function PaymentDialog({
  open, onOpenChange, target, pending, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: { plan: string; cycle: "monthly"|"yearly"; price: number; name: string } | null;
  pending: boolean;
  onConfirm: () => void;
}) {
  const [method, setMethod] = useState<"card"|"upi"|"netbanking"|"wallet">("card");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [upi, setUpi] = useState("");
  const [bank, setBank] = useState("hdfc");
  const [wallet, setWallet] = useState("paytm");
  const [stage, setStage] = useState<"form"|"upi_waiting"|"netbanking_redirect"|"success">("form");
  const [countdown, setCountdown] = useState(45);
  const [bankCreds, setBankCreds] = useState({ userId: "", password: "" });
  const [txnId, setTxnId] = useState("");
  const [receiptNo, setReceiptNo] = useState("");

  // Reset internal state whenever the dialog closes
  useEffect(() => {
    if (!open) {
      setStage("form");
      setCountdown(45);
      setBankCreds({ userId: "", password: "" });
      setTxnId("");
    }
  }, [open]);

  // UPI collect-request countdown
  useEffect(() => {
    if (stage !== "upi_waiting") return;
    if (countdown <= 0) {
      toast.error("UPI collect request timed out. Please try again.", { id: "pay" });
      setStage("form");
      setCountdown(45);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, countdown]);

  function completePayment() {
    const ts = Date.now();
    setTxnId("TXN" + ts.toString().slice(-10));
    setReceiptNo("RCPT-" + ts.toString().slice(-8));
    setStage("success");
    toast.success("Payment successful", { id: "pay" });
  }

  function startPay() {
    if (method === "card") {
      const digits = card.number.replace(/\s/g, "");
      if (digits.length < 12 || !/^\d+$/.test(digits)) return toast.error("Enter a valid card number");
      if (!card.name.trim()) return toast.error("Enter cardholder name");
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return toast.error("Expiry must be MM/YY");
      if (!/^\d{3,4}$/.test(card.cvv)) return toast.error("Invalid CVV");
      toast.loading("Authorizing card...", { id: "pay" });
      setTimeout(completePayment, 900);
    } else if (method === "upi") {
      if (!/^[\w.\-]+@[\w.\-]+$/.test(upi)) return toast.error("Enter a valid UPI ID (e.g. name@bank)");
      setCountdown(45);
      setStage("upi_waiting");
      toast.loading(`Collect request sent to ${upi}`, { id: "pay" });
    } else if (method === "netbanking") {
      setBankCreds({ userId: "", password: "" });
      setStage("netbanking_redirect");
      toast.loading(`Redirecting to ${banks.find((b) => b.code === bank)?.name}...`, { id: "pay" });
    } else {
      toast.loading(`Opening ${wallets.find((w) => w.code === wallet)?.name}...`, { id: "pay" });
      setTimeout(completePayment, 900);
    }
  }

  const banks = [
    { code: "hdfc", name: "HDFC Bank" },
    { code: "icici", name: "ICICI Bank" },
    { code: "sbi", name: "State Bank of India" },
    { code: "axis", name: "Axis Bank" },
    { code: "kotak", name: "Kotak Mahindra Bank" },
    { code: "yes", name: "Yes Bank" },
    { code: "pnb", name: "Punjab National Bank" },
  ];
  const wallets = [
    { code: "paytm", name: "Paytm" },
    { code: "phonepe", name: "PhonePe" },
    { code: "gpay", name: "Google Pay" },
    { code: "amazonpay", name: "Amazon Pay" },
  ];
  const selectedBank = banks.find((b) => b.code === bank);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {stage === "success" ? (
              <><CheckCircle2 className="h-4 w-4 text-success" /> Payment Successful</>
            ) : stage === "upi_waiting" ? (
              <><Smartphone className="h-4 w-4 text-primary" /> Approve on your UPI app</>
            ) : stage === "netbanking_redirect" ? (
              <><Landmark className="h-4 w-4 text-primary" /> {selectedBank?.name} · Secure Login</>
            ) : (
              <><Lock className="h-4 w-4 text-success" /> Secure Checkout</>
            )}
          </DialogTitle>
          <DialogDescription>
            {target ? (
              <>Upgrade to <span className="font-semibold text-foreground">{target.name}</span> · <span className="font-semibold text-foreground">${target.price}</span> billed {target.cycle}</>
            ) : "Select a payment method"}
          </DialogDescription>
        </DialogHeader>

        {stage === "form" && (
          <>
            <Tabs value={method} onValueChange={(v) => setMethod(v as typeof method)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="card" className="gap-1 text-xs"><CreditCard className="h-3.5 w-3.5" />Card</TabsTrigger>
                <TabsTrigger value="upi" className="gap-1 text-xs"><Smartphone className="h-3.5 w-3.5" />UPI</TabsTrigger>
                <TabsTrigger value="netbanking" className="gap-1 text-xs"><Landmark className="h-3.5 w-3.5" />Net Banking</TabsTrigger>
                <TabsTrigger value="wallet" className="gap-1 text-xs"><Wallet className="h-3.5 w-3.5" />Wallet</TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="space-y-3 pt-4">
                <div>
                  <Label className="text-xs">Card Number</Label>
                  <Input
                    inputMode="numeric"
                    placeholder="1234 5678 9012 3456"
                    value={card.number}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, "").slice(0, 16);
                      setCard({ ...card, number: d.replace(/(.{4})/g, "$1 ").trim() });
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Cardholder Name</Label>
                  <Input placeholder="Name on card" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Expiry (MM/YY)</Label>
                    <Input
                      placeholder="12/28"
                      value={card.expiry}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                        setCard({ ...card, expiry: v });
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">CVV</Label>
                    <Input
                      inputMode="numeric"
                      type="password"
                      placeholder="•••"
                      value={card.cvv}
                      onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="upi" className="space-y-3 pt-4">
                <Label className="text-xs">UPI ID</Label>
                <Input placeholder="yourname@okhdfcbank" value={upi} onChange={(e) => setUpi(e.target.value)} />
                <div className="flex flex-wrap gap-2 pt-1">
                  {["@okhdfcbank","@okicici","@oksbi","@okaxis","@paytm"].map((s) => (
                    <button key={s} type="button" onClick={() => setUpi((upi.split("@")[0] || "user") + s)} className="rounded-md border border-border/60 bg-background/40 px-2 py-1 text-xs hover:bg-accent">
                      {s}
                    </button>
                  ))}
                </div>
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
                  <p className="mb-1 font-semibold text-foreground">How it works</p>
                  <ol className="list-decimal space-y-0.5 pl-4">
                    <li>Enter your UPI ID and tap <span className="font-medium text-foreground">Send request</span>.</li>
                    <li>Open GPay / PhonePe / Paytm / your bank app.</li>
                    <li>Approve the collect request for ${target?.price ?? 0}.</li>
                  </ol>
                </div>
              </TabsContent>

              <TabsContent value="netbanking" className="space-y-3 pt-4">
                <Label className="text-xs">Select your bank</Label>
                <RadioGroup value={bank} onValueChange={setBank} className="grid grid-cols-2 gap-2">
                  {banks.map((b) => (
                    <label key={b.code} htmlFor={`bank-${b.code}`} className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-background/40 p-2.5 text-sm hover:bg-accent">
                      <RadioGroupItem id={`bank-${b.code}`} value={b.code} />
                      {b.name}
                    </label>
                  ))}
                </RadioGroup>
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
                  <p className="mb-1 font-semibold text-foreground">What happens next</p>
                  <p>You'll be redirected to your bank's secure login page to authorize a payment of ${target?.price ?? 0}. Do not refresh or close the tab until you're brought back here.</p>
                </div>
              </TabsContent>

              <TabsContent value="wallet" className="space-y-3 pt-4">
                <Label className="text-xs">Choose a wallet</Label>
                <RadioGroup value={wallet} onValueChange={setWallet} className="grid grid-cols-2 gap-2">
                  {wallets.map((w) => (
                    <label key={w.code} htmlFor={`w-${w.code}`} className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-background/40 p-2.5 text-sm hover:bg-accent">
                      <RadioGroupItem id={`w-${w.code}`} value={w.code} />
                      {w.name}
                    </label>
                  ))}
                </RadioGroup>
              </TabsContent>
            </Tabs>

            <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Lock className="h-3 w-3 text-success" /> This is a demo checkout — no real payment is processed.</div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
              <Button className="bg-gradient-to-r from-primary to-chart-4" onClick={startPay} disabled={pending}>
                {method === "upi" ? "Send request" : method === "netbanking" ? "Continue to bank" : target ? `Pay $${target.price}` : "Pay"}
              </Button>
            </DialogFooter>
          </>
        )}

        {stage === "upi_waiting" && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center py-4">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-chart-4/20">
                  <Smartphone className="h-7 w-7 text-primary" />
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm">Collect request sent to <span className="font-mono font-semibold text-foreground">{upi}</span></p>
              <p className="mt-1 text-xs text-muted-foreground">Open your UPI app and approve the payment of <span className="font-semibold text-foreground">${target?.price ?? 0}</span></p>
              <p className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Waiting for approval · <span className="font-mono">{countdown}s</span>
              </p>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-semibold text-foreground">Instructions</p>
              <ol className="list-decimal space-y-0.5 pl-4">
                <li>Open your UPI app (GPay, PhonePe, Paytm, or your bank app).</li>
                <li>Check pending requests / notifications.</li>
                <li>Enter your UPI PIN to approve.</li>
              </ol>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => { setStage("form"); toast.dismiss("pay"); }}>
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Change method
              </Button>
              <Button className="bg-gradient-to-r from-primary to-chart-4" onClick={completePayment}>
                I've approved the request
              </Button>
            </DialogFooter>
          </div>
        )}

        {stage === "netbanking_redirect" && (
          <div className="space-y-3 py-2">
            <div className="rounded-lg border-2 border-primary/40 bg-background p-4">
              <div className="mb-3 flex items-center gap-2 border-b border-border/60 pb-2">
                <ShieldCheck className="h-4 w-4 text-success" />
                <p className="text-sm font-semibold">{selectedBank?.name} · NetSecure Login</p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Customer / User ID</Label>
                  <Input value={bankCreds.userId} onChange={(e) => setBankCreds({ ...bankCreds, userId: e.target.value })} placeholder="Enter your user ID" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Login Password</Label>
                  <Input type="password" value={bankCreds.password} onChange={(e) => setBankCreds({ ...bankCreds, password: e.target.value })} placeholder="Enter your password" className="mt-1" />
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Merchant: App2Rack</span>
                  <span className="font-semibold">Amount: ${target?.price ?? 0}</span>
                </div>
              </div>
            </div>
            <p className="text-center text-[11px] text-muted-foreground">
              This is a simulated bank page. Never share real banking credentials in a demo.
            </p>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => { setStage("form"); toast.dismiss("pay"); }}>
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
              </Button>
              <Button
                className="bg-gradient-to-r from-primary to-chart-4"
                onClick={() => {
                  if (!bankCreds.userId.trim() || !bankCreds.password.trim()) return toast.error("Enter user ID and password");
                  toast.loading("Verifying with bank...", { id: "pay" });
                  setTimeout(completePayment, 1100);
                }}
              >
                Login & Pay ${target?.price ?? 0}
              </Button>
            </DialogFooter>
          </div>
        )}

        {stage === "success" && (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center py-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="h-9 w-9 text-success" />
              </div>
              <p className="mt-3 text-lg font-semibold">Payment received</p>
              <p className="text-xs text-muted-foreground">Activating your {target?.name} plan...</p>
            </div>
            <div className="space-y-1.5 rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
              <Row label="Receipt #" value={receiptNo} mono />
              <Row label="Amount" value={`$${target?.price ?? 0}`} />
              <Row label="Plan" value={`${target?.name ?? ""} · ${target?.cycle ?? ""}`} />
              <Row label="Method" value={
                method === "card" ? `Card •••• ${card.number.slice(-4)}` :
                method === "upi" ? `UPI · ${upi}` :
                method === "netbanking" ? `Net Banking · ${selectedBank?.name ?? ""}` :
                `Wallet · ${wallets.find((w) => w.code === wallet)?.name ?? ""}`
              } />
              <Row label="Transaction ID" value={txnId} mono />
              <Row label="Date" value={new Date().toLocaleString()} />
            </div>
            {(() => {
              const receipt: ReceiptData = {
                number: receiptNo,
                date: new Date().toLocaleString(),
                amount: target?.price ?? 0,
                currency: "USD",
                plan: target?.name,
                cycle: target?.cycle,
                method:
                  method === "card" ? `Card •••• ${card.number.slice(-4)}` :
                  method === "upi" ? `UPI · ${upi}` :
                  method === "netbanking" ? `Net Banking · ${selectedBank?.name ?? ""}` :
                  `Wallet · ${wallets.find((w) => w.code === wallet)?.name ?? ""}`,
                transactionId: txnId,
                status: "Paid",
              };
              return (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => downloadReceipt(receipt)}>
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Download receipt
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => printReceipt(receipt)}>
                      <Printer className="mr-1.5 h-3.5 w-3.5" /> Print / Save PDF
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button className="w-full bg-gradient-to-r from-primary to-chart-4" onClick={onConfirm} disabled={pending}>
                      {pending ? "Activating plan..." : "Continue to Billing"}
                    </Button>
                  </DialogFooter>
                </>
              );
            })()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-foreground" : "font-medium text-foreground"}>{value}</span>
    </div>
  );
}

function ComparisonTable({ plans }: { plans: Array<{ code: string; features: unknown; max_servers: number | null; max_racks: number | null; max_applications: number | null; monthly_credits: number }> }) {
  const rows: Array<{ label: string; key: string; kind?: "limit"; limitKey?: "max_servers"|"max_racks"|"max_applications" }> = [
    { label: "Applications", key: "_apps", kind: "limit", limitKey: "max_applications" },
    { label: "Servers", key: "_srv", kind: "limit", limitKey: "max_servers" },
    { label: "Racks", key: "_rack", kind: "limit", limitKey: "max_racks" },
    { label: "Dashboards", key: "dashboard" },
    { label: "AI Chat", key: "ai_chat" },
    { label: "AI Log Analyzer", key: "log_analyzer" },
    { label: "Root Cause Analysis", key: "rca" },
    { label: "Optimization Advisor", key: "optimization_advisor" },
    { label: "Reports", key: "basic_reports" },
    { label: "API Access", key: "api_access" },
    { label: "Audit Logs", key: "audit_logs" },
    { label: "Webhooks", key: "webhooks" },
    { label: "RBAC", key: "rbac" },
    { label: "Unlimited AI", key: "unlimited_credits" },
    { label: "Priority Support", key: "priority_support" },
    { label: "SSO", key: "sso" },
    { label: "White Label", key: "white_label" },
    { label: "Dedicated Infrastructure", key: "dedicated_infra" },
  ];
  const has = (p: { features: unknown }, key: string) => Array.isArray(p.features) && (p.features as string[]).includes(key);
  return (
    <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur">
      <div className="border-b border-border/60 p-4"><h3 className="text-sm font-semibold">Feature Comparison</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20">
              <th className="p-3 text-left font-medium">Feature</th>
              {plans.map((p) => <th key={p.code} className="p-3 text-center font-medium capitalize">{p.code}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-border/40">
                <td className="p-3">{r.label}</td>
                {plans.map((p) => {
                  let val: ReactNode = "—";
                  if (r.kind === "limit" && r.limitKey) {
                    const v = p[r.limitKey];
                    val = v == null ? "Unlimited" : String(v);
                  } else if (r.key === "unlimited_credits") {
                    val = p.monthly_credits === -1 ? <Check className="mx-auto h-4 w-4 text-success" /> : "—";
                  } else {
                    val = has(p, r.key) ? <Check className="mx-auto h-4 w-4 text-success" /> : "—";
                  }
                  return <td key={p.code} className="p-3 text-center">{val}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}