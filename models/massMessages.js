const mongoose = require('mongoose');

const massMessageSchema = new mongoose.Schema(
  {
    content: { type: String, trim: true },
    image: {
      url: String,
      public_id: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MassMessage', massMessageSchema);
