const mongoose = require('mongoose');

const blockedSchema = new mongoose.Schema(
  {
    mobile: String,
  },
  { timestamps: true }
);
module.exports = mongoose.model('Blocked', blockedSchema);
