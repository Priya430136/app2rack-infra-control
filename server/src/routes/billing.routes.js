const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

router.get('/plans', protect, billingController.getPlans);
router.get('/credit-packages', protect, billingController.getCreditPackages);
router.get('/subscription', protect, billingController.getSubscription);
router.get('/wallet', protect, billingController.getWallet);
router.get('/transactions', protect, billingController.getTransactions);
router.get('/invoices', protect, billingController.getInvoices);
router.get('/usage', protect, billingController.getUsage);

router.post('/checkout', protect, [
  body('plan_code').isIn(['free', 'pro', 'business', 'enterprise']),
  body('cycle').isIn(['monthly', 'yearly']).optional(),
], validate, billingController.checkout);

router.post('/cancel', protect, billingController.cancelSubscription);

router.post('/consume', protect, [
  body('feature').notEmpty(),
  body('amount').isInt({ min: 0 }),
], validate, billingController.consumeCredits);

router.post('/buy-package', protect, [
  body('code').notEmpty(),
], validate, billingController.buyPackage);

module.exports = router;
