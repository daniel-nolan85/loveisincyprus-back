const express = require('express');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const {
  calculateFinalAmount,
  createPayment,
} = require('../controllers/cardinity');

// routes
router.post('/calculate-final-amount', authCheck, calculateFinalAmount);
router.post('/create-payment', authCheck, createPayment);

module.exports = router;
