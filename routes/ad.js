const express = require('express');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const {
  submitAd,
  fetchAds,
  fetchApprovedAds,
  disapproveAd,
  approveAd,
  handleExpiredAds,
} = require('../controllers/ad');

// routes
router.post('/submit-ad', authCheck, submitAd);
router.post('/fetch-ads', authCheck, fetchAds);
router.post('/fetch-approved-ads', authCheck, fetchApprovedAds);
router.put('/disapprove-ad', authCheck, disapproveAd);
router.put('/approve-ad', authCheck, approveAd);
router.put('/expired-ad', handleExpiredAds);

module.exports = router;
