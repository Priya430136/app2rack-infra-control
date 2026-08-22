import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import api from "./api";

export type CreditPackage = { code: string; name: string; price: number | string; credits: number };
export type UsageRow = { created_at: string; credits_cost: number; feature: string };
export type Plan = {
  code: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_popular?: boolean;
  monthly_credits: number;
  max_servers?: number | null;
  max_racks?: number | null;
  max_applications?: number | null;
};
export type Invoice = {
  id: string;
  number: string;
  created_at: string;
  amount: number | string;
  status: string;
  period_start?: string | null;
  period_end?: string | null;
};
export type TransactionRow = {
  id: string;
  created_at: string;
  reason: string;
  delta: number;
  balance_after: number;
};

export const listPlans = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await api.get<Plan[]>("/billing/plans");
  return (data ?? []) as Plan[];
});

export const listCreditPackages = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await api.get<CreditPackage[]>("/billing/credit-packages");
  return (data ?? []) as CreditPackage[];
});

export const getMySubscription = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await api.get("/billing/subscription");
  return data;
});

export const getMyWallet = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await api.get("/billing/wallet");
  return data;
});

export const listMyTransactions = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await api.get<TransactionRow[]>("/billing/transactions");
  return (data ?? []) as TransactionRow[];
});

export const listMyInvoices = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await api.get<Invoice[]>("/billing/invoices");
  return (data ?? []) as Invoice[];
});

export const listMyUsage = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await api.get<UsageRow[]>("/billing/usage");
  return (data ?? []) as UsageRow[];
});

// ===== Mutations =====
export const mockCheckout = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      plan_code: z.enum(["free", "pro", "business", "enterprise"]),
      cycle: z.enum(["monthly", "yearly"]),
    }),
  )
  .handler(async ({ data }) => {
    const { data: res } = await api.post("/billing/checkout", data);
    return res;
  });

export const cancelSubscription = createServerFn({ method: "POST" }).handler(async () => {
  const { data } = await api.post("/billing/cancel");
  return data;
});

export const consumeCredits = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { data: res } = await api.post("/billing/consume", data);
  return res;
});

export const buyCreditPackage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ code: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { data: res } = await api.post("/billing/buy-package", data);
    return res;
  });
