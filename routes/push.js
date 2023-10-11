const express = require('express');
const router = express.Router();

// middleware
const { authCheck } = require('../middleware/auth');

// controllers
const { sendPushNotification } = require('../controllers/push');

// routes
router.post('/send-push-notification', authCheck, sendPushNotification);

module.exports = router;
