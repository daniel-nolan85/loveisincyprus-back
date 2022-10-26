const express = require('express');
const formidable = require('express-formidable');

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
  removeAd,
} = require('../controllers/ad');

const { uploadImage } = require('../controllers/post');

// routes
router.post('/submit-ad', submitAd);
router.post(
  '/upload-ad-image',
  formidable({ maxFileSize: 5 * 1024 * 1024 }),
  uploadImage
);
router.post('/fetch-ads', fetchAds);
router.get('/fetch-approved-ads', fetchApprovedAds);
router.put('/disapprove-ad', authCheck, adminCheck, disapproveAd);
router.put('/approve-ad', authCheck, adminCheck, approveAd);
router.put('/expired-ad', handleExpiredAds);
router.delete('/remove-ad/:adId', removeAd);

module.exports = router;
