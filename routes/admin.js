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
  setPreferences,
  fetchProductsForReview,
  fetchNewOrders,
  fetchNewRefunds,
  usersData,
  progressCompletionData,
  pointsData,
  updateUserProgress,
  followingData,
  followersData,
  visitorsData,
  ordersData,
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
router.put('/set-preferences', authCheck, adminCheck, setPreferences);
router.get('/fetch-products-for-review', fetchProductsForReview);
router.get('/fetch-new-orders', fetchNewOrders);
router.get('/fetch-new-refunds', fetchNewRefunds);
router.post('/users-data', authCheck, adminCheck, usersData);
router.post('/progress-completion-data', authCheck, progressCompletionData);
router.post('/points-data', authCheck, pointsData);
router.put('/update-user-progress', updateUserProgress);
router.post('/following-data', authCheck, followingData);
router.post('/followers-data', authCheck, followersData);
router.post('/visitors-data', authCheck, visitorsData);
router.post('/orders-data', authCheck, ordersData);

module.exports = router;
