import { useQuery, useQueryClient } from "@tanstack/react-query";
import { myWalletQO, mySubscriptionQO } from "@/lib/billing-queries";
import { consumeCredits } from "@/lib/billing.functions";
import { CREDIT_COSTS, type FeatureCode } from "@/lib/credit-costs";
import { toast } from "sonner";

export function useCredits() {
  const qc = useQueryClient();
  const wallet = useQuery(myWalletQO);
  const sub = useQuery(mySubscriptionQO);
  const balance = wallet.data?.balance ?? 0;
  const isUnlimited = sub.data?.plan_code === "enterprise";

  async function spend(feature: FeatureCode): Promise<boolean> {
    const cost = CREDIT_COSTS[feature];
    if (isUnlimited) {
      try {
        await consumeCredits({ data: { feature, amount: 0 } });
      } catch {
        /* ignore */
      }
      return true;
    }
    if (balance < cost) {
      toast.error(`Not enough credits. Needs ${cost}, you have ${balance}.`, {
        description: "Upgrade or buy more credits to continue.",
      });
      return false;
    }
    const ok = window.confirm(`This will use ${cost} credits. You have ${balance}. Continue?`);
    if (!ok) return false;
    try {
      const res = await consumeCredits({ data: { feature, amount: cost } });
      await qc.invalidateQueries({ queryKey: ["my-wallet"] });
      await qc.invalidateQueries({ queryKey: ["my-transactions"] });
      await qc.invalidateQueries({ queryKey: ["my-usage"] });
      if (res.balance < wallet.data!.monthly_allowance * 0.2) {
        toast.warning(`Low credits: ${res.balance} remaining`);
      }
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("INSUFFICIENT_CREDITS")) {
        toast.error("Not enough credits");
      } else {
        toast.error("Failed to consume credits");
      }
      return false;
    }
  }

  return { balance, isUnlimited, spend, wallet: wallet.data };
}
