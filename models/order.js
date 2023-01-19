const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: ObjectId,
          ref: 'Product',
        },
        count: Number,
      },
    ],
    paymentIntent: {},
    orderStatus: {
      type: String,
      default: 'Not Processed',
      enum: [
        'Not Processed',
        'Processing',
        'Dispatched',
        'Cancelled',
        'Completed',
      ],
    },
    orderedBy: { type: ObjectId, ref: 'User' },
    deliverTo: String,
    deliveryAddress: Object,
    discount: Number,
    deliveryFee: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
