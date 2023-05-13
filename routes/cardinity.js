const express = require('express');

const router = express.Router();

// middleware
const {
  authCheck,
  adminCheck,
  eligibleForRefund,
} = require('../middleware/auth');

// controllers
const {
  calculateFinalAmount,
  createPayment,
  createAdPayment,
  createGCPayment,
  createMembershipPayment,
  refundSubscription,
  handlePending,
  handleAdPending,
  handleGCPending,
  handleMembershipPending,
} = require('../controllers/cardinity');

// routes
router.post('/calculate-final-amount', authCheck, calculateFinalAmount);
router.post('/create-payment', authCheck, createPayment);
router.post('/create-ad-payment', createAdPayment);
router.post('/create-gc-payment', authCheck, createGCPayment);
router.post('/create-membership-payment', authCheck, createMembershipPayment);
router.post(
  '/refund-subscription',
  authCheck,
  eligibleForRefund,
  refundSubscription
);
router.post('/cardinity/3d/callback', handlePending);
router.post('/cardinity/ad/3d/callback', handleAdPending);
router.post('/cardinity/gc/3d/callback', handleGCPending);
router.post(
  '/cardinity/membership/3d/callback/:userId',
  handleMembershipPending
);

module.exports = router;
