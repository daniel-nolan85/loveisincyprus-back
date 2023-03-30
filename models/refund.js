const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const refundSchema = new mongoose.Schema(
  {
    reason: {
      type: String,
      trim: true,
      required: 'Reason is required',
      minlength: [1, 'Reason is too short'],
      maxlength: [500, 'Reason is too long'],
    },
    items: [
      {
        type: ObjectId,
        ref: 'Product',
        required: 'Product is required',
      },
    ],
    refundImages: Array,
    refundAmount: Number,
    orderedBy: {
      type: ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Refund', refundSchema);
