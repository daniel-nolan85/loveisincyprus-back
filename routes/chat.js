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
} = require('../controllers/chat');

// routes
router.post('/access-chat', authCheck, accessChat);
router.post('/fetch-chats', authCheck, fetchChats);
router.post('/send-message', authCheck, sendMessage);
router.get('/chats/:chatId', authCheck, allMessages);

module.exports = router;
