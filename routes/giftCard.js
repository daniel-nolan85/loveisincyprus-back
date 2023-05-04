const express = require('express');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const {
  sendCard,
  fetchCardsReceived,
  fetchCardsSent,
} = require('../controllers/giftCard');

// routes
router.post('/send-card', sendCard);
router.post('/fetch-gift-cards-received', authCheck, fetchCardsReceived);
router.post('/fetch-gift-cards-sent', authCheck, fetchCardsSent);

module.exports = router;
