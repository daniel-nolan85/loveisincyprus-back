const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

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
      public_id: String,
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
    succeeded: Boolean,
    from: { type: ObjectId, ref: 'User' },
    to: { type: ObjectId, ref: 'User' },
    expiry: Date,
    couponCode: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('GiftCard', gifCardSchema);
