const express = require('express');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const {
  requestRefund,
  fetchRefunds,
  itemsReturned,
  itemsNotReturned,
  rejectRefund,
  processRefund,
  emailBuyer,
} = require('../controllers/refund');

// routes
router.post('/request-refund', authCheck, requestRefund);
router.get('/fetch-refunds', authCheck, adminCheck, fetchRefunds);
router.put('/handle-returns', authCheck, adminCheck, itemsReturned);
router.put('/handle-unreturns', authCheck, adminCheck, itemsNotReturned);
router.put('/reject-refund', authCheck, adminCheck, rejectRefund);
router.put('/process-refund', authCheck, adminCheck, processRefund);
router.post('/email-buyer', authCheck, adminCheck, emailBuyer);

module.exports = router;
