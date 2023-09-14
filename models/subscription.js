const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const subscriptionSchema = new mongoose.Schema(
  {
    paymentType: String,
    startDate: { type: Date },
    expiryDate: { type: Date },
    duration: Number,
    cost: String,
    userInfo: {
      type: ObjectId,
      ref: 'User',
    },
    trialPeriod: {
      type: Boolean,
      default: true,
    },
    new: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
