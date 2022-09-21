const express = require('express');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const {
  calculateFinalAmount,
  createPayment,
  createAdPayment,
  createMembershipPayment,
} = require('../controllers/cardinity');

// routes
router.post('/calculate-final-amount', authCheck, calculateFinalAmount);
router.post('/create-payment', authCheck, createPayment);
router.post('/create-ad-payment', authCheck, adminCheck, createAdPayment);
router.post('/create-membership-payment', authCheck, createMembershipPayment);

module.exports = router;
