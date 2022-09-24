const express = require('express');
const router = express.Router();

// middleware
const {
  authCheck,
  adminCheck,
  subscriberCheck,
} = require('../middleware/auth');

// controllers
const {
  accessChat,
  fetchChats,
  sendMessage,
  allMessages,
  massMail,
} = require('../controllers/chat');

// routes
router.post('/access-chat', authCheck, subscriberCheck, accessChat);
router.post('/fetch-chats', authCheck, subscriberCheck, fetchChats);
router.post('/send-message', authCheck, subscriberCheck, sendMessage);
router.get('/chats/:chatId', authCheck, subscriberCheck, allMessages);
router.post('/mass-mail', authCheck, adminCheck, massMail);

module.exports = router;
