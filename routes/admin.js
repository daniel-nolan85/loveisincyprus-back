const express = require('express');
const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const {
  orders,
  orderStatus,
  subscriptions,
  fetchOptIns,
  totalMessages,
  incomeTaken,
  fetchNewAds,
  fetchNewVerifs,
  fetchReportedContent,
  approveComment,
  approvePost,
  approveMessage,
  setPreferences,
  fetchProductsForReview,
  fetchNewOrders,
  fetchNewSubscriptions,
  seenSubs,
  fetchNewRefunds,
  usersData,
  progressCompletionData,
  pointsData,
  updateUserProgress,
  cancelTrials,
  followingData,
  followersData,
  visitorsData,
  ordersData,
  gcSentData,
  gcReceivedData,
  usersForAnalytics,
  fetchBlockedNumbers,
  removeNumber,
  blockNumber,
} = require('../controllers/admin');

// routes
router.get('/admin/orders', authCheck, adminCheck, orders);
router.put('/admin/order-status', authCheck, adminCheck, orderStatus);
router.get('/admin/subscriptions', authCheck, adminCheck, subscriptions);
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
router.put('/set-preferences', authCheck, adminCheck, setPreferences);
router.get('/fetch-products-for-review', fetchProductsForReview);
router.get('/fetch-new-orders', fetchNewOrders);
router.get('/fetch-new-subscriptions', fetchNewSubscriptions);
router.put('/seen-subs', authCheck, adminCheck, seenSubs);
router.get('/fetch-new-refunds', fetchNewRefunds);
router.post('/users-data', authCheck, adminCheck, usersData);
router.post('/progress-completion-data', authCheck, progressCompletionData);
router.post('/points-data', authCheck, pointsData);
router.put('/update-user-progress', updateUserProgress);
router.put('/cancel-trial-periods', cancelTrials);
router.post('/following-data', authCheck, followingData);
router.post('/followers-data', authCheck, followersData);
router.post('/visitors-data', authCheck, visitorsData);
router.post('/orders-data', authCheck, ordersData);
router.post('/gc-sent-data', authCheck, gcSentData);
router.post('/gc-received-data', authCheck, gcReceivedData);
router.get(
  '/fetch-users-for-analytics',
  authCheck,
  adminCheck,
  usersForAnalytics
);
router.get('/fetch-blocked-numbers', fetchBlockedNumbers);
router.delete(
  '/remove-blocked-num/:numId',
  authCheck,
  adminCheck,
  removeNumber
);
router.post('/block-number', authCheck, adminCheck, blockNumber);

module.exports = router;
