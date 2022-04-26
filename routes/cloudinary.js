const express = require('express');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const { upload, remove } = require('../controllers/cloudinary');

// routes
router.post('/upload-images', authCheck, adminCheck, upload);
router.post('/remove-image', authCheck, adminCheck, remove);

module.exports = router;
