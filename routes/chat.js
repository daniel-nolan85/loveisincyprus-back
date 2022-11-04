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
  chatMatches,
  fetchTheirChats,
  markRead,
} = require('../controllers/chat');

// routes
router.post('/access-chat', authCheck, accessChat);
router.post('/fetch-chats', authCheck, fetchChats);
router.post('/fetch-their-chats', authCheck, fetchTheirChats);
router.post('/send-message', authCheck, sendMessage);
router.get('/chats/:chatId', authCheck, allMessages);
router.post('/mass-mail', authCheck, adminCheck, massMail);
router.post('/my-chat-matches', authCheck, chatMatches);
router.put('/mark-read', markRead);

module.exports = router;
