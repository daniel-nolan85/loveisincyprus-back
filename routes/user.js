const express = require('express');
const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const {
  recaptcha,
  contactFormEmail,
  usersPhotos,
  visitorPhotos,
} = require('../controllers/user');

// routes
router.post('/recaptcha', recaptcha);
router.post('/contact-form-email', contactFormEmail);
router.post('/users-photos', authCheck, usersPhotos);
router.post('/visitor-photos', authCheck, visitorPhotos);

module.exports = router;
