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
  deleteAfterUse,
} = require('../controllers/coupon');

// routes
router.post('/coupon', authCheck, adminCheck, create);
router.get('/coupons', list);
router.delete('/coupon/:couponId', authCheck, adminCheck, remove);
router.put('/coupon/:couponId', authCheck, adminCheck, update);
router.delete('/delete-coupon/:couponId', authCheck, deleteAfterUse);

module.exports = router;
