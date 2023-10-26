const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const couponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      uppercase: true,
      required: 'Name is required',
      minlength: [6, 'Coupon name is too short'],
      maxlength: [18, 'Coupon name is too long'],
    },
    products: [{ type: ObjectId, ref: 'Product' }],
    expiry: {
      type: Date,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    subscription: {
      type: Boolean,
      default: false,
    },
    partner: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
