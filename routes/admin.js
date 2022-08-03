const express = require('express');
const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const { orders, orderStatus, fetchOptIns } = require('../controllers/admin');

// routes
router.get('/admin/orders', authCheck, adminCheck, orders);
router.put('/admin/order-status', authCheck, adminCheck, orderStatus);
router.post('/fetch-optins', authCheck, adminCheck, fetchOptIns);

module.exports = router;
