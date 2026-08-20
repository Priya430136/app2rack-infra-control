import { createServerFn } from "@tanstack/react-start";
import api from "./api";

export const listPlans = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await api.get("/billing/plans");
    return data ?? [];
  });

export const listCreditPackages = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await api.get("/billing/credit-packages");
    return data ?? [];
  });

export const getMySubscription = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await api.get("/billing/subscription");
    return data;
  });

export const getMyWallet = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await api.get("/billing/wallet");
    return data;
  });

export const listMyTransactions = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await api.get("/billing/transactions");
    return data ?? [];
  });

export const listMyInvoices = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await api.get("/billing/invoices");
    return data ?? [];
  });

export const listMyUsage = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await api.get("/billing/usage");
    return data ?? [];
  });

// ===== Mutations =====
export const mockCheckout = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { data: res } = await api.post("/billing/checkout", data);
    return res;
  });

export const cancelSubscription = createServerFn({ method: "POST" })
  .handler(async () => {
    const { data } = await api.post("/billing/cancel");
    return data;
  });

export const consumeCredits = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { data: res } = await api.post("/billing/consume", data);
    return res;
  });

export const buyCreditPackage = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { data: res } = await api.post("/billing/buy-package", data);
    return res;
  });
