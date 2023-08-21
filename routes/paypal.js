const express = require('express');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const {
  calculateFinalAmount,
  createPayPalOrder,
  createPayPalAuthorization,
  capturePayPalShopOrder,
  refundPayPalShopOrder,
  capturePayPalSubOrder,
  refundPayPalSubOrder,
  capturePayPalGCOrder,
  authorizePayPalAdOrder,
  capturePayPalAdAuthorization,
  voidPayPalAdAuthorization,
} = require('../controllers/paypal');

// routes
router.post('/calculate-final-amount', authCheck, calculateFinalAmount);
router.post('/create-paypal-order', authCheck, createPayPalOrder);
router.post('/create-ad-paypal-authorization', createPayPalAuthorization);
router.post('/capture-paypal-shop-order', authCheck, capturePayPalShopOrder);
router.post('/refund-paypal-shop-order', authCheck, refundPayPalShopOrder);
router.post(
  '/capture-paypal-subscription-order',
  authCheck,
  capturePayPalSubOrder
);
router.post(
  '/refund-paypal-subscription-order',
  authCheck,
  refundPayPalSubOrder
);
router.post('/capture-paypal-gc-order', authCheck, capturePayPalGCOrder);
router.post('/authorize-paypal-ad-order', authorizePayPalAdOrder);
router.post('/capture-paypal-ad-auth', capturePayPalAdAuthorization);
router.post('/void-paypal-ad-auth', voidPayPalAdAuthorization);

module.exports = router;
