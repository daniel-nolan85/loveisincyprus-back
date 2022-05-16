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

module.exports = router;
