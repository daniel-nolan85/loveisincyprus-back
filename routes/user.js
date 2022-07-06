const express = require('express');
const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

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
  getUserPointsGainedData,
  getUserPointsLostData,
  fetchNotifications,
  populateNotifications,
  markNotifAsRead,
  deleteNotification,
  // searchMatches,
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
router.get('/user-points-gained-data', authCheck, getUserPointsGainedData);
router.get('/user-points-lost-data', authCheck, getUserPointsLostData);
router.post('/fetch-notifications', authCheck, fetchNotifications);
router.post('/populate-notifications', authCheck, populateNotifications);
router.post('/mark-notif-as-read', authCheck, markNotifAsRead);
router.put('/delete-notification', authCheck, deleteNotification);
// router.get('/search-matches', authCheck, searchMatches);

module.exports = router;
