import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { myWalletQO, creditPackagesQO, myTransactionsQO, myUsageQO } from "@/lib/billing-queries";
import type { UsageRow } from "@/lib/billing.functions";
import { buyCreditPackage } from "@/lib/billing.functions";
import { CREDIT_COSTS, FEATURE_LABELS } from "@/lib/credit-costs";
import {
  Zap,
  TrendingUp,
  Package,
  CreditCard,
  Smartphone,
  Landmark,
  Wallet,
  Lock,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Download,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { downloadReceipt, printReceipt, type ReceiptData } from "@/lib/receipt";

export const Route = createFileRoute("/_authenticated/billing/credits")({ component: CreditsPage });

function CreditsPage() {
  const walletQ = useQuery(myWalletQO);
  const pkgQ = useQuery(creditPackagesQO);
  const txQ = useQuery(myTransactionsQO);
  const usageQ = useQuery(myUsageQO);
  const qc = useQueryClient();
  const buy = useMutation({
    mutationFn: (code: string) => buyCreditPackage({ data: { code } }),
    onSuccess: async (res) => {
      await qc.invalidateQueries();
      toast.success(`+${res.credits} credits added!`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Purchase failed"),
  });

  const [payOpen, setPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<{
    code: string;
    name: string;
    price: number;
    credits: number;
  } | null>(null);

  const w = walletQ.data;
  const balance = w?.balance ?? 0;
  const allowance = w?.monthly_allowance ?? 20;
  const used = Math.max(0, allowance - balance);
  const usedPct = allowance > 0 ? (used / allowance) * 100 : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailyUsage = (usageQ.data ?? [])
    .filter((u) => new Date(u.created_at) >= today)
    .reduce((sum: number, u: UsageRow) => sum + u.credits_cost, 0);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthUsage = (usageQ.data ?? [])
    .filter((u) => new Date(u.created_at) >= monthAgo)
    .reduce((sum: number, u: UsageRow) => sum + u.credits_cost, 0);

  return (
    <>
      <TopBar title="AI Credits" subtitle="Track and manage your AI usage credits" />
      <div className="p-6 space-y-6">
        {/* Wallet overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatTile
            label="Current Balance"
            value={balance}
            icon={<Zap className="h-5 w-5 text-warning" />}
          />
          <StatTile
            label="Monthly Allowance"
            value={allowance}
            icon={<Package className="h-5 w-5 text-primary" />}
          />
          <StatTile
            label="Used This Month"
            value={monthUsage}
            icon={<TrendingUp className="h-5 w-5 text-destructive" />}
          />
          <StatTile
            label="Today"
            value={dailyUsage}
            icon={<TrendingUp className="h-5 w-5 text-success" />}
          />
        </div>

        <Card className="border-border/60 bg-card/60 p-6 backdrop-blur">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium">Credits used this cycle</span>
            <span className="text-muted-foreground">
              {used} / {allowance}
            </span>
          </div>
          <Progress value={usedPct} className="h-3" />
          {usedPct >= 80 && (
            <p className="mt-2 text-xs text-warning">
              You've used {usedPct.toFixed(0)}% of your monthly credits. Consider upgrading.
            </p>
          )}
        </Card>

        {/* Credit cost table */}
        <Card className="border-border/60 bg-card/60 backdrop-blur">
          <div className="border-b border-border/60 p-4">
            <h3 className="text-sm font-semibold">Credit Cost per Feature</h3>
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(CREDIT_COSTS).map(([k, cost]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 p-3"
              >
                <span className="text-sm">{FEATURE_LABELS[k as keyof typeof FEATURE_LABELS]}</span>
                <Badge variant="secondary">
                  {cost} {cost === 1 ? "credit" : "credits"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Buy more */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Buy More Credits
          </h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(pkgQ.data ?? []).map((p, i) => (
              <motion.div
                key={p.code}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="h-full border-border/60 bg-card/60 p-5 backdrop-blur transition-transform hover:scale-105">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.name}</p>
                  <p className="mt-1 text-3xl font-bold">${Number(p.price)}</p>
                  <p className="text-sm text-primary">{p.credits.toLocaleString()} credits</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    ~{Math.floor(p.credits / 8)} AI analyses
                  </p>
                  <Button
                    className="mt-4 w-full bg-gradient-to-r from-primary to-chart-4"
                    onClick={() => {
                      setPayTarget({
                        code: p.code,
                        name: p.name,
                        price: Number(p.price),
                        credits: p.credits,
                      });
                      setPayOpen(true);
                    }}
                    disabled={buy.isPending}
                  >
                    <Lock className="mr-1.5 h-3.5 w-3.5" /> Pay & Add Credits
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <Card className="border-border/60 bg-card/60 backdrop-blur">
          <div className="border-b border-border/60 p-4">
            <h3 className="text-sm font-semibold">Recent Transactions</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">When</th>
                  <th className="p-3 text-left">Reason</th>
                  <th className="p-3 text-right">Δ</th>
                  <th className="p-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {(txQ.data ?? []).map((t) => (
                  <tr key={t.id} className="border-t border-border/40">
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td className="p-3">{t.reason}</td>
                    <td
                      className={`p-3 text-right font-mono ${t.delta >= 0 ? "text-success" : "text-destructive"}`}
                    >
                      {t.delta > 0 ? "+" : ""}
                      {t.delta}
                    </td>
                    <td className="p-3 text-right font-mono">{t.balance_after}</td>
                  </tr>
                ))}
                {(!txQ.data || txQ.data.length === 0) && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No transactions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <CreditPaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        target={payTarget}
        pending={buy.isPending}
        onConfirm={() => {
          if (!payTarget) return;
          buy.mutate(payTarget.code, { onSuccess: () => setPayOpen(false) });
        }}
      />
    </>
  );
}

function StatTile({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="border-border/60 bg-card/60 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-3xl font-bold">{value.toLocaleString()}</p>
    </Card>
  );
}

function CreditPaymentDialog({
  open,
  onOpenChange,
  target,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: { code: string; name: string; price: number; credits: number } | null;
  pending: boolean;
  onConfirm: () => void;
}) {
  const [method, setMethod] = useState<"card" | "upi" | "netbanking" | "wallet">("card");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [upi, setUpi] = useState("");
  const [bank, setBank] = useState("hdfc");
  const [wallet, setWallet] = useState("paytm");
  const [stage, setStage] = useState<"form" | "upi_waiting" | "netbanking_redirect" | "success">(
    "form",
  );
  const [countdown, setCountdown] = useState(45);
  const [bankCreds, setBankCreds] = useState({ userId: "", password: "" });
  const [txnId, setTxnId] = useState("");
  const [receiptNo, setReceiptNo] = useState("");

  useEffect(() => {
    if (!open) {
      setStage("form");
      setCountdown(45);
      setBankCreds({ userId: "", password: "" });
      setTxnId("");
      setReceiptNo("");
    }
  }, [open]);

  useEffect(() => {
    if (stage !== "upi_waiting") return;
    if (countdown <= 0) {
      toast.error("UPI collect request timed out.", { id: "credit-pay" });
      setStage("form");
      setCountdown(45);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, countdown]);

  const banks = [
    { code: "hdfc", name: "HDFC Bank" },
    { code: "icici", name: "ICICI Bank" },
    { code: "sbi", name: "State Bank of India" },
    { code: "axis", name: "Axis Bank" },
    { code: "kotak", name: "Kotak Mahindra Bank" },
    { code: "yes", name: "Yes Bank" },
  ];
  const wallets = [
    { code: "paytm", name: "Paytm" },
    { code: "phonepe", name: "PhonePe" },
    { code: "gpay", name: "Google Pay" },
    { code: "amazonpay", name: "Amazon Pay" },
  ];
  const selectedBank = banks.find((b) => b.code === bank);

  function completePayment() {
    const ts = Date.now();
    setTxnId("TXN" + ts.toString().slice(-10));
    setReceiptNo("RCPT-" + ts.toString().slice(-8));
    setStage("success");
    toast.success("Payment successful", { id: "credit-pay" });
  }

  function startPay() {
    if (method === "card") {
      const digits = card.number.replace(/\s/g, "");
      if (digits.length < 12 || !/^\d+$/.test(digits))
        return toast.error("Enter a valid card number");
      if (!card.name.trim()) return toast.error("Enter cardholder name");
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return toast.error("Expiry must be MM/YY");
      if (!/^\d{3,4}$/.test(card.cvv)) return toast.error("Invalid CVV");
      toast.loading("Authorizing card...", { id: "credit-pay" });
      setTimeout(completePayment, 900);
    } else if (method === "upi") {
      if (!/^[\w.-]+@[\w.-]+$/.test(upi))
        return toast.error("Enter a valid UPI ID (e.g. name@bank)");
      setCountdown(45);
      setStage("upi_waiting");
      toast.loading(`Collect request sent to ${upi}`, { id: "credit-pay" });
    } else if (method === "netbanking") {
      setBankCreds({ userId: "", password: "" });
      setStage("netbanking_redirect");
      toast.loading(`Redirecting to ${selectedBank?.name}...`, { id: "credit-pay" });
    } else {
      toast.loading(`Opening ${wallets.find((w) => w.code === wallet)?.name}...`, {
        id: "credit-pay",
      });
      setTimeout(completePayment, 900);
    }
  }

  const methodLabel =
    method === "card"
      ? `Card •••• ${card.number.slice(-4)}`
      : method === "upi"
        ? `UPI · ${upi}`
        : method === "netbanking"
          ? `Net Banking · ${selectedBank?.name ?? ""}`
          : `Wallet · ${wallets.find((w) => w.code === wallet)?.name ?? ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {stage === "success" ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-success" /> Payment Successful
              </>
            ) : stage === "upi_waiting" ? (
              <>
                <Smartphone className="h-4 w-4 text-primary" /> Approve on your UPI app
              </>
            ) : stage === "netbanking_redirect" ? (
              <>
                <Landmark className="h-4 w-4 text-primary" /> {selectedBank?.name} · Secure Login
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-success" /> Buy Credits · Secure Checkout
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {target ? (
              <>
                Purchase{" "}
                <span className="font-semibold text-foreground">
                  {target.credits.toLocaleString()} credits
                </span>{" "}
                ({target.name}) for{" "}
                <span className="font-semibold text-foreground">${target.price}</span>
              </>
            ) : (
              "Select a payment method"
            )}
          </DialogDescription>
        </DialogHeader>

        {stage === "form" && (
          <>
            <Tabs value={method} onValueChange={(v) => setMethod(v as typeof method)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="card" className="gap-1 text-xs">
                  <CreditCard className="h-3.5 w-3.5" />
                  Card
                </TabsTrigger>
                <TabsTrigger value="upi" className="gap-1 text-xs">
                  <Smartphone className="h-3.5 w-3.5" />
                  UPI
                </TabsTrigger>
                <TabsTrigger value="netbanking" className="gap-1 text-xs">
                  <Landmark className="h-3.5 w-3.5" />
                  Net Banking
                </TabsTrigger>
                <TabsTrigger value="wallet" className="gap-1 text-xs">
                  <Wallet className="h-3.5 w-3.5" />
                  Wallet
                </TabsTrigger>
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
                  <Input
                    placeholder="Name on card"
                    value={card.name}
                    onChange={(e) => setCard({ ...card, name: e.target.value })}
                    className="mt-1"
                  />
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
                      onChange={(e) =>
                        setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="upi" className="space-y-3 pt-4">
                <Label className="text-xs">UPI ID</Label>
                <Input
                  placeholder="yourname@okhdfcbank"
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {["@okhdfcbank", "@okicici", "@oksbi", "@okaxis", "@paytm"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setUpi((upi.split("@")[0] || "user") + s)}
                      className="rounded-md border border-border/60 bg-background/40 px-2 py-1 text-xs hover:bg-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
                  Approve the collect request for ${target?.price ?? 0} in your UPI app to receive{" "}
                  {target?.credits.toLocaleString()} credits.
                </div>
              </TabsContent>

              <TabsContent value="netbanking" className="space-y-3 pt-4">
                <Label className="text-xs">Select your bank</Label>
                <RadioGroup value={bank} onValueChange={setBank} className="grid grid-cols-2 gap-2">
                  {banks.map((b) => (
                    <label
                      key={b.code}
                      htmlFor={`cb-${b.code}`}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-background/40 p-2.5 text-sm hover:bg-accent"
                    >
                      <RadioGroupItem id={`cb-${b.code}`} value={b.code} />
                      {b.name}
                    </label>
                  ))}
                </RadioGroup>
              </TabsContent>

              <TabsContent value="wallet" className="space-y-3 pt-4">
                <Label className="text-xs">Choose a wallet</Label>
                <RadioGroup
                  value={wallet}
                  onValueChange={setWallet}
                  className="grid grid-cols-2 gap-2"
                >
                  {wallets.map((w) => (
                    <label
                      key={w.code}
                      htmlFor={`cw-${w.code}`}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-background/40 p-2.5 text-sm hover:bg-accent"
                    >
                      <RadioGroupItem id={`cw-${w.code}`} value={w.code} />
                      {w.name}
                    </label>
                  ))}
                </RadioGroup>
              </TabsContent>
            </Tabs>

            <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Lock className="h-3 w-3 text-success" /> Demo checkout — no real payment is
                processed. Credits are added only after payment succeeds.
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-primary to-chart-4"
                onClick={startPay}
                disabled={pending}
              >
                {method === "upi"
                  ? "Send request"
                  : method === "netbanking"
                    ? "Continue to bank"
                    : target
                      ? `Pay $${target.price}`
                      : "Pay"}
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
              <p className="text-sm">
                Collect request sent to{" "}
                <span className="font-mono font-semibold text-foreground">{upi}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Approve <span className="font-semibold text-foreground">${target?.price ?? 0}</span>{" "}
                in your UPI app
              </p>
              <p className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Waiting for approval ·{" "}
                <span className="font-mono">{countdown}s</span>
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStage("form");
                  toast.dismiss("credit-pay");
                }}
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Change method
              </Button>
              <Button
                className="bg-gradient-to-r from-primary to-chart-4"
                onClick={completePayment}
              >
                I've approved
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
                  <Input
                    value={bankCreds.userId}
                    onChange={(e) => setBankCreds({ ...bankCreds, userId: e.target.value })}
                    placeholder="Enter your user ID"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Login Password</Label>
                  <Input
                    type="password"
                    value={bankCreds.password}
                    onChange={(e) => setBankCreds({ ...bankCreds, password: e.target.value })}
                    placeholder="Enter your password"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Merchant: App2Rack Credits</span>
                  <span className="font-semibold">Amount: ${target?.price ?? 0}</span>
                </div>
              </div>
            </div>
            <p className="text-center text-[11px] text-muted-foreground">
              Simulated bank page — do not enter real credentials.
            </p>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStage("form");
                  toast.dismiss("credit-pay");
                }}
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
              </Button>
              <Button
                className="bg-gradient-to-r from-primary to-chart-4"
                onClick={() => {
                  if (!bankCreds.userId.trim() || !bankCreds.password.trim())
                    return toast.error("Enter user ID and password");
                  toast.loading("Verifying with bank...", { id: "credit-pay" });
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
              <p className="text-xs text-muted-foreground">
                Adding {target?.credits.toLocaleString()} credits to your wallet...
              </p>
            </div>
            <div className="space-y-1.5 rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
              <SmallRow label="Receipt #" value={receiptNo} mono />
              <SmallRow label="Package" value={target?.name ?? ""} />
              <SmallRow
                label="Credits"
                value={target ? `+${target.credits.toLocaleString()}` : ""}
              />
              <SmallRow label="Amount" value={`$${target?.price ?? 0}`} />
              <SmallRow label="Method" value={methodLabel} />
              <SmallRow label="Transaction ID" value={txnId} mono />
              <SmallRow label="Date" value={new Date().toLocaleString()} />
            </div>
            {(() => {
              const receipt: ReceiptData = {
                number: receiptNo,
                date: new Date().toLocaleString(),
                amount: target?.price ?? 0,
                currency: "USD",
                plan: `${target?.credits.toLocaleString()} credits (${target?.name})`,
                method: methodLabel,
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
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-chart-4"
                      onClick={onConfirm}
                      disabled={pending}
                    >
                      {pending ? "Adding credits..." : "Add Credits to Wallet"}
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

function SmallRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-foreground" : "font-medium text-foreground"}>
        {value}
      </span>
    </div>
  );
}
