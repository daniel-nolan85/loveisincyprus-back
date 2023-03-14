const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const postSchema = new mongoose.Schema(
  {
    content: {
      type: {},
      required: true,
    },
    postedBy: {
      type: ObjectId,
      ref: 'User',
    },
    postImages: Array,
    likes: [{ type: ObjectId, ref: 'User' }],
    comments: [
      {
        text: String,
        created: { type: Date, default: Date.now },
        postedBy: {
          type: ObjectId,
          ref: 'User',
        },
        image: {
          url: String,
          public_id: String,
        },
        reported: { type: Boolean, default: false },
      },
    ],
    reported: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
