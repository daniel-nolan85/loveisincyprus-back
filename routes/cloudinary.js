const express = require('express');

const router = express.Router();

// middleware
const { authCheck } = require('../middleware/auth');

// controllers
const { upload, remove } = require('../controllers/cloudinary');

// routes
router.post('/upload-images', authCheck, upload);
router.post('/remove-image', authCheck, remove);

module.exports = router;
