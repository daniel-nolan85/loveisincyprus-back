const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const subscriptionSchema = new mongoose.Schema(
  {
    paymentType: String,
    startDate: { type: Date },
    expiryDate: { type: Date },
    duration: Number,
    userInfo: {
      type: ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
