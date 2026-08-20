import { queryOptions } from "@tanstack/react-query";
import {
  listPlans, listCreditPackages, getMySubscription, getMyWallet,
  listMyTransactions, listMyInvoices, listMyUsage,
} from "@/lib/billing.functions";

export const plansQO = queryOptions({ queryKey: ["plans"], queryFn: () => listPlans() });
export const creditPackagesQO = queryOptions({ queryKey: ["credit-packages"], queryFn: () => listCreditPackages() });
export const mySubscriptionQO = queryOptions({ queryKey: ["my-subscription"], queryFn: () => getMySubscription() });
export const myWalletQO = queryOptions({ queryKey: ["my-wallet"], queryFn: () => getMyWallet() });
export const myTransactionsQO = queryOptions({ queryKey: ["my-transactions"], queryFn: () => listMyTransactions() });
export const myInvoicesQO = queryOptions({ queryKey: ["my-invoices"], queryFn: () => listMyInvoices() });
export const myUsageQO = queryOptions({ queryKey: ["my-usage"], queryFn: () => listMyUsage() });