const express = require('express');
const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const {
  accessChat,
  fetchChats,
  sendMessage,
  allMessages,
  massMail,
} = require('../controllers/chat');

// routes
router.post('/access-chat', authCheck, accessChat);
router.post('/fetch-chats', authCheck, fetchChats);
router.post('/send-message', authCheck, sendMessage);
router.get('/chats/:chatId', authCheck, allMessages);
router.post('/mass-mail', authCheck, adminCheck, massMail);

module.exports = router;