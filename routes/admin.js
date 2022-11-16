const express = require('express');
const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const {
  orders,
  orderStatus,
  fetchOptIns,
  totalMessages,
  incomeTaken,
  fetchNewAds,
  fetchNewVerifs,
  fetchReportedContent,
  approveComment,
  approvePost,
  approveMessage,
} = require('../controllers/admin');

// routes
router.get('/admin/orders', authCheck, adminCheck, orders);
router.put('/admin/order-status', authCheck, adminCheck, orderStatus);
router.post('/fetch-optins', authCheck, adminCheck, fetchOptIns);
router.get('/total-messages', totalMessages);
router.get('/income-taken', incomeTaken);
router.get('/fetch-new-ads', fetchNewAds);
router.get('/fetch-new-verifs', fetchNewVerifs);
router.get('/fetch-reported-content', fetchReportedContent);
router.put('/admin-approve-comment', authCheck, adminCheck, approveComment);
router.put('/approve-post/:postId', authCheck, adminCheck, approvePost);
router.put(
  '/approve-message/:messageId',
  authCheck,
  adminCheck,
  approveMessage
);

module.exports = router;
