const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
      minlength: [1, 'Title is too short'],
      maxlength: [50, 'Title is too long'],
      text: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      minlength: [1, 'Description is too short'],
      maxlength: [5000, 'Description is too long'],
      text: true,
    },
    price: {
      type: Number,
      trim: true,
      required: true,
      minlength: [1, 'Price is too short'],
      maxlength: [50, 'Price is too long'],
      text: true,
    },
    category: {
      type: ObjectId,
      ref: 'Category',
    },
    subs: [
      {
        type: ObjectId,
        ref: 'Sub',
      },
    ],
    quantity: Number,
    sold: {
      type: Number,
      default: 0,
    },
    images: {
      type: Array,
    },
    ratings: [
      {
        star: Number,
        postedBy: { type: ObjectId, ref: 'User' },
      },
    ],
    weight: {
      type: Number,
      trim: true,
      required: true,
      minlength: [1, 'Weight is too short'],
      maxlength: [50, 'Weight is too long'],
    },
    approved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
