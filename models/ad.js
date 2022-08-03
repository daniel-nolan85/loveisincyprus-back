const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const adSchema = new mongoose.Schema(
  {
    content: {
      type: {},
      required: true,
    },
    postedBy: {
      type: ObjectId,
      ref: 'User',
    },
    image: {
      url: String,
      pulic_id: String,
    },
    duration: String,
    status: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ad', adSchema);
