const express = require('express');

const router = express.Router();

// middleware
const { authCheck } = require('../middleware/auth');

// controllers
const { requestRefund } = require('../controllers/refund');

// routes
router.post('/request-refund', authCheck, requestRefund);

module.exports = router;
