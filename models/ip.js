const mongoose = require('mongoose');

const ipSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      trim: true,
      required: 'Address is required',
    },
    city: String,
    country: String,
    postal: String,
    region: String,
    timezone: String,
  },
  { timestamps: true }
);
module.exports = mongoose.model('Ip', ipSchema);
