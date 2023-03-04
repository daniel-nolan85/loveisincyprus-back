const mongoose = require('mongoose');

const gifCardSchema = new mongoose.Schema(
  {
    greeting: {
      type: String,
      trim: true,
      required: true,
      minlength: [1, 'Greeting is too short'],
      maxlength: [100, 'Greeting is too long'],
    },
    image: {
      url: String,
      pulic_id: String,
    },
    message: {
      type: String,
      trim: true,
      required: true,
      minlength: [1, 'Message is too short'],
      maxlength: [500, 'Message is too long'],
    },
    amount: {
      type: Number,
      required: true,
    },
    paid: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model('GiftCard', gifCardSchema);
