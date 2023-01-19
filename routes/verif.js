const express = require('express');

const router = express.Router();

// middleware
const { authCheck } = require('../middleware/auth');

// controllers
const {
  submitVerif,
  fetchVerifs,
  disapproveVerif,
  approveVerif,
} = require('../controllers/verif');

// routes
router.post('/submit-verif', authCheck, submitVerif);
router.post('/fetch-verifs', authCheck, fetchVerifs);
router.put('/disapprove-verif', authCheck, disapproveVerif);
router.put('/approve-verif', authCheck, approveVerif);

module.exports = router;
