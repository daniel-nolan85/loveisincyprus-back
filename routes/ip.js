const express = require('express');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const { fetchIps, removeIp, banIp } = require('../controllers/ip');

// routes
router.get('/fetch-ips', fetchIps);
router.delete('/remove-ip/:ipId', authCheck, adminCheck, removeIp);
router.post('/ban-ip', authCheck, adminCheck, banIp);

module.exports = router;
