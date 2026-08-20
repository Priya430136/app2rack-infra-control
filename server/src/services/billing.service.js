const db = require('../database');

const listPlans = async () => {
  const result = await db.query('SELECT * FROM plans ORDER BY sort_order');
  return result.rows;
};

const listCreditPackages = async () => {
  const result = await db.query('SELECT * FROM credit_packages ORDER BY sort_order');
  return result.rows;
};

// Lazily provisions a free-tier subscription on first read, since registration
// does not create one. ON CONFLICT DO UPDATE (a no-op self-assignment) is used
// instead of DO NOTHING so RETURNING always yields a row, whether inserted or pre-existing.
const getMySubscription = async (userId) => {
  const result = await db.query(
    `INSERT INTO subscriptions (user_id, plan_code)
     VALUES ($1, 'free')
     ON CONFLICT (user_id) DO UPDATE SET user_id = subscriptions.user_id
     RETURNING *`,
    [userId]
  );
  return result.rows[0];
};

// Same lazy-provisioning approach as getMySubscription - guarantees a row exists
// before consumeCredits/buyCreditPackage try to UPDATE it (an UPDATE against a
// missing row silently affects zero rows).
const getMyWallet = async (userId) => {
  const result = await db.query(
    `INSERT INTO credit_wallets (user_id, balance, monthly_allowance)
     VALUES ($1, 20, 20)
     ON CONFLICT (user_id) DO UPDATE SET user_id = credit_wallets.user_id
     RETURNING *`,
    [userId]
  );
  return result.rows[0];
};

const listMyTransactions = async (userId) => {
  const result = await db.query(
    'SELECT * FROM credit_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
    [userId]
  );
  return result.rows;
};

const listMyInvoices = async (userId) => {
  const result = await db.query(
    'SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

const listMyUsage = async (userId) => {
  const result = await db.query(
    'SELECT * FROM feature_usage WHERE user_id = $1 ORDER BY created_at DESC LIMIT 500',
    [userId]
  );
  return result.rows;
};

// Mutations
const applyPlan = async (userId, planCode, cycle) => {
  // Original implementation used Supabase RPC 'apply_plan'
  // For now, we'll mock the database update until the RPC logic is ported to a service
  await db.query(
    `INSERT INTO subscriptions (user_id, plan_code, billing_cycle, status, current_period_start, current_period_end) 
     VALUES ($1, $2, $3, 'active', NOW(), NOW() + INTERVAL '1 month')
     ON CONFLICT (user_id) DO UPDATE SET plan_code = $2, billing_cycle = $3, status = 'active', updated_at = NOW()`,
    [userId, planCode, cycle]
  );
  return { ok: true };
};

const cancelSubscription = async (userId) => {
  await db.query(
    'UPDATE subscriptions SET cancel_at_period_end = true, updated_at = NOW() WHERE user_id = $1',
    [userId]
  );
  return { ok: true };
};

const consumeCredits = async (userId, feature, amount) => {
  // Original implementation used Supabase RPC 'consume_credits'
  // Mock logic: Check balance and deduct
  const wallet = await getMyWallet(userId);
  if (wallet.balance < amount) {
    throw new Error('INSUFFICIENT_CREDITS');
  }

  const newBalance = wallet.balance - amount;
  await db.query(
    'UPDATE credit_wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2',
    [newBalance, userId]
  );

  await db.query(
    'INSERT INTO credit_transactions (user_id, delta, reason, balance_after) VALUES ($1, $2, $3, $4)',
    [userId, -amount, `consumed_${feature}`, newBalance]
  );

  return { balance: newBalance, consumed: amount };
};

const buyCreditPackage = async (userId, code) => {
  const pkgResult = await db.query('SELECT * FROM credit_packages WHERE code = $1', [code]);
  const pkg = pkgResult.rows[0];
  if (!pkg) throw new Error('Unknown package');

  // Grant credits (mocking grant_credits RPC logic)
  const wallet = await getMyWallet(userId);
  const newBalance = (wallet.balance || 0) + pkg.credits;
  
  await db.query(
    `INSERT INTO credit_wallets (user_id, balance, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (user_id) DO UPDATE SET balance = $2, updated_at = NOW()`,
    [userId, newBalance]
  );

  await db.query(
    'INSERT INTO credit_transactions (user_id, delta, reason, balance_after, metadata) VALUES ($1, $2, $3, $4, $5)',
    [userId, pkg.credits, `pkg_${pkg.code}`, newBalance, JSON.stringify({ package: pkg.code, price: pkg.price })]
  );

  await db.query(
    'INSERT INTO payments (user_id, amount, kind, metadata) VALUES ($1, $2, $3, $4)',
    [userId, pkg.price, 'credits', JSON.stringify({ package: pkg.code, credits: pkg.credits })]
  );

  await db.query(
    'INSERT INTO invoices (user_id, number, amount, status, period_start, period_end) VALUES ($1, $2, $3, $4, NOW(), NOW())',
    [userId, `INV-${Date.now()}`, pkg.price, 'paid']
  );

  return { ok: true, credits: pkg.credits };
};

module.exports = {
  listPlans, listCreditPackages, getMySubscription, getMyWallet,
  listMyTransactions, listMyInvoices, listMyUsage,
  applyPlan, cancelSubscription, consumeCredits, buyCreditPackage
};
