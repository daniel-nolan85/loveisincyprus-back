const express = require('express');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const { create, list, read, update, cancel } = require('../controllers/event');

// routes
router.post('/event', authCheck, adminCheck, create);
router.get('/events', list);
router.get('/event/:eventId', read);
router.put('/event', authCheck, adminCheck, update);
router.put('/event/:eventId', authCheck, adminCheck, cancel);

module.exports = router;
