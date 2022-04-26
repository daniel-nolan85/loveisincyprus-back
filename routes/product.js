const express = require('express');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const { create, read } = require('../controllers/product');

// routes
router.post('/product', authCheck, adminCheck, create);
router.get('/products', read);

module.exports = router;
