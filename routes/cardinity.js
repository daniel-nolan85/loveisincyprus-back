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
  createMembershipPayment,
  refundSubscription,
  handlePending,
} = require('../controllers/cardinity');

// routes
router.post('/calculate-final-amount', authCheck, calculateFinalAmount);
router.post('/create-payment', authCheck, createPayment);
router.post('/create-ad-payment', authCheck, adminCheck, createAdPayment);
router.post('/create-membership-payment', authCheck, createMembershipPayment);
router.post(
  '/refund-subscription',
  authCheck,
  eligibleForRefund,
  refundSubscription
);
router.post('/cardinity/3d/callback', authCheck, handlePending);

module.exports = router;
