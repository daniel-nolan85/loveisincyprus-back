const express = require('express');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const {
  create,
  list,
  remove,
  update,
  handleAfterUse,
  deleteExpiredCoupon,
} = require('../controllers/coupon');

// routes
router.post('/coupon', authCheck, adminCheck, create);
router.get('/coupons', list);
router.delete('/coupon/:couponId', authCheck, adminCheck, remove);
router.put('/coupon/:couponId', authCheck, adminCheck, update);
router.put('/handle-coupon/:couponId', authCheck, handleAfterUse);
router.delete('/delete-expired-coupon', deleteExpiredCoupon);

module.exports = router;
