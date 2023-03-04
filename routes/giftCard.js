const express = require('express');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const { sendCard } = require('../controllers/giftCard');

// routes
router.post('/send-card', sendCard);
// router.post(
//   '/upload-ad-image',
//   formidable({ maxFileSize: 5 * 1024 * 1024 }),
//   uploadImage
// );
// router.post('/fetch-ads', fetchAds);
// router.get('/fetch-approved-ads', fetchApprovedAds);
// router.put('/disapprove-ad', authCheck, adminCheck, disapproveAd);
// router.put('/approve-ad', authCheck, adminCheck, approveAd);
// router.put('/expired-ad', handleExpiredAds);
// router.delete('/remove-ad/:adId', removeAd);

module.exports = router;
