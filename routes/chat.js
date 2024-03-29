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
  chatMatches,
  fetchTheirChats,
  markRead,
  reportMessage,
  fetchReportedMessages,
  deleteMessage,
  fetchAllChats,
  fetchMassMessages,
  fetchMailchimpData,
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
router.put('/report-message/:messageId', authCheck, reportMessage);
router.post('/fetch-reported-messages', fetchReportedMessages);
router.put(
  '/admin/delete-message/:messageId',
  authCheck,
  adminCheck,
  deleteMessage
);
router.post('/fetch-all-chats', authCheck, adminCheck, fetchAllChats);
router.post('/fetch-mass-messages', authCheck, adminCheck, fetchMassMessages);
router.post('/fetch-mailchimp-data', authCheck, adminCheck, fetchMailchimpData);

module.exports = router;
