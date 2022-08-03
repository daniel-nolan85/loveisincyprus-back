const express = require('express');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const {
  submitAd,
  fetchAds,
  disapproveAd,
  approveAd,
} = require('../controllers/ad');

// routes
router.post('/submit-ad', authCheck, submitAd);
router.post('/fetch-ads', authCheck, fetchAds);
router.put('/disapprove-ad', authCheck, disapproveAd);
router.put('/approve-ad', authCheck, approveAd);

module.exports = router;
