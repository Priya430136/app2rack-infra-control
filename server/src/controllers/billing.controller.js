const billingService = require('../services/billing.service');

const getPlans = async (req, res, next) => {
  try {
    const plans = await billingService.listPlans();
    res.json(plans);
  } catch (err) {
    next(err);
  }
};

const getCreditPackages = async (req, res, next) => {
  try {
    const packages = await billingService.listCreditPackages();
    res.json(packages);
  } catch (err) {
    next(err);
  }
};

const getSubscription = async (req, res, next) => {
  try {
    const sub = await billingService.getMySubscription(req.user.id);
    res.json(sub);
  } catch (err) {
    next(err);
  }
};

const getWallet = async (req, res, next) => {
  try {
    const wallet = await billingService.getMyWallet(req.user.id);
    res.json(wallet);
  } catch (err) {
    next(err);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const transactions = await billingService.listMyTransactions(req.user.id);
    res.json(transactions);
  } catch (err) {
    next(err);
  }
};

const getInvoices = async (req, res, next) => {
  try {
    const invoices = await billingService.listMyInvoices(req.user.id);
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};

const getUsage = async (req, res, next) => {
  try {
    const usage = await billingService.listMyUsage(req.user.id);
    res.json(usage);
  } catch (err) {
    next(err);
  }
};

const checkout = async (req, res, next) => {
  try {
    const { plan_code, cycle } = req.body;
    await billingService.applyPlan(req.user.id, plan_code, cycle);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    await billingService.cancelSubscription(req.user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

const consumeCredits = async (req, res, next) => {
  try {
    const { feature, amount } = req.body;
    const result = await billingService.consumeCredits(req.user.id, feature, amount);
    res.json(result);
  } catch (err) {
    if (err.message === 'INSUFFICIENT_CREDITS') {
      return res.status(402).json({ error: 'INSUFFICIENT_CREDITS' });
    }
    next(err);
  }
};

const buyPackage = async (req, res, next) => {
  try {
    const { code } = req.body;
    const result = await billingService.buyCreditPackage(req.user.id, code);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPlans, getCreditPackages, getSubscription, getWallet,
  getTransactions, getInvoices, getUsage,
  checkout, cancelSubscription, consumeCredits, buyPackage
};
