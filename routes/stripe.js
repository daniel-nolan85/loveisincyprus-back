const express = require('express');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const { createPaymentIntent } = require('../controllers/stripe');

// routes
router.post('/create-payment-intent', authCheck, createPaymentIntent);

module.exports = router;
