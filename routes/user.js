const express = require('express');
const router = express.Router();

// middleware
const {
  authCheck,
  adminCheck,
  subscriberCheck,
} = require('../middleware/auth');

// controllers
const {
  recaptcha,
  contactFormEmail,
  usersPhotos,
  visitorPhotos,
  userCart,
  getUserCart,
  emptyCart,
  saveAddress,
  applyCouponToUserCart,
  createOrder,
  orders,
  addToWishlist,
  wishlist,
  removeFromWishlist,
  getUserPointsTotal,
  addPoints,
  removePoints,
  spentPoints,
  getUserPointsGainedData,
  getUserPointsLostData,
  getUserPointsSpentData,
  fetchNotifications,
  populateNotifications,
  markNotifAsRead,
  acceptInvite,
  maybe,
  declineInvite,
  listAll,
  searchFilters,
  saveSearch,
  analyseUsers,
  progressCompletion,
  optInOrOut,
  newMessageCount,
  newNotificationCount,
  resetNotificationCount,
  fetchUserSearches,
  expiredMembership,
  clearProfileImage,
  totalUsers,
  fetchProducts,
  expiredSuspension,
  highCompats,
  updateAge,
} = require('../controllers/user');

// routes
router.post('/recaptcha', recaptcha);
router.post('/contact-form-email', contactFormEmail);
router.post('/users-photos', authCheck, usersPhotos);
router.post('/visitor-photos', authCheck, visitorPhotos);
router.post('/cart', authCheck, userCart);
router.get('/cart', authCheck, getUserCart);
router.delete('/cart', authCheck, emptyCart);
router.post('/address', authCheck, saveAddress);
router.post('/cart/coupon', authCheck, applyCouponToUserCart);
router.post('/order', authCheck, createOrder);
router.get('/user-orders', authCheck, orders);
router.post('/user-wishlist', authCheck, addToWishlist);
router.get('/user-wishlist', authCheck, wishlist);
router.put('/user-wishlist/:productId', authCheck, removeFromWishlist);
router.get('/user-points-total', authCheck, getUserPointsTotal);
router.put('/add-points', authCheck, addPoints);
router.put('/remove-points', authCheck, removePoints);
router.put('/spent-points', authCheck, spentPoints);
router.get('/user-points-gained-data', authCheck, getUserPointsGainedData);
router.get('/user-points-lost-data', authCheck, getUserPointsLostData);
router.get('/user-points-spent-data', authCheck, getUserPointsSpentData);
router.post('/fetch-notifications', authCheck, fetchNotifications);
router.post('/populate-notifications', authCheck, populateNotifications);
router.post('/mark-notif-as-read', authCheck, markNotifAsRead);
router.post('/accept-invite', authCheck, acceptInvite);
router.post('/maybe', authCheck, maybe);
router.post('/decline-invite', authCheck, declineInvite);
router.get('/fetch-users/:count', authCheck, listAll);
router.post('/fetch-users/filters', authCheck, searchFilters);
router.post('/save-search', authCheck, adminCheck, saveSearch);
router.post('/analyse-users', authCheck, analyseUsers);
router.post('/progress-completion', authCheck, progressCompletion);
router.put('/user-opt-in-or-out', authCheck, optInOrOut);
router.put('/new-message-count', newMessageCount);
router.put('/new-notification-count', newNotificationCount);
router.put('/reset-notification-count', authCheck, resetNotificationCount);
router.get('/fetch-user-searches', fetchUserSearches);
router.put('/expired-membership', expiredMembership);
router.put('/clear-profile-image', authCheck, clearProfileImage);
router.get('/total-users', totalUsers);
router.post('/fetch-products', fetchProducts);
router.put('/expired-suspension', expiredSuspension);
router.post('/high-compat-users', authCheck, subscriberCheck, highCompats);
router.put('/update-age', updateAge);

module.exports = router;
