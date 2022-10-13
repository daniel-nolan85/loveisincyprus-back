const express = require('express');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');
const {
  canEditDeleteEventPost,
  canDeleteEventComment,
  canEditComment,
} = require('../middleware/post');

// controllers
const {
  create,
  list,
  read,
  update,
  cancel,
  fetchUserEvents,
  fetchPrevEvents,
  fetchComingEvents,
  fetchEvent,
  createEventPost,
  likeEventPost,
  unlikeEventPost,
  updateEventPost,
  deleteEventPost,
  addEventComment,
  removeEventComment,
  updateEventComment,
  expiredEvent,
  acceptEventInvite,
  maybeEventInvite,
  declineEventInvite,
} = require('../controllers/event');

// routes
router.post('/event', authCheck, adminCheck, create);
router.get('/events', list);
router.get('/event/:eventId', read);
router.put('/event', authCheck, adminCheck, update);
router.put('/event/:eventId', authCheck, adminCheck, cancel);
router.post('/fetch-user-events', authCheck, fetchUserEvents);
router.post('/fetch-prev-events', authCheck, fetchPrevEvents);
router.post('/fetch-coming-events', authCheck, fetchComingEvents);
router.post('/fetch-event', authCheck, fetchEvent);
router.post('/create-event-post', authCheck, createEventPost);
router.put('/like-event-post', authCheck, likeEventPost);
router.put('/unlike-event-post', authCheck, unlikeEventPost);
router.put(
  '/update-event-post/:postId',
  authCheck,
  canEditDeleteEventPost,
  updateEventPost
);
router.put(
  '/delete-event-post/:postId',
  authCheck,
  canEditDeleteEventPost,
  deleteEventPost
);
router.put('/add-event-comment', authCheck, addEventComment);
router.put(
  '/remove-event-comment',
  authCheck,
  canDeleteEventComment,
  removeEventComment
);
router.put(
  '/update-event-comment',
  authCheck,
  canEditComment,
  updateEventComment
);
router.put('/expired-event', expiredEvent);
router.post('/accept-event-invite', authCheck, acceptEventInvite);
router.post('/maybe-event-invite', authCheck, maybeEventInvite);
router.post('/decline-event-invite', authCheck, declineEventInvite);

module.exports = router;
