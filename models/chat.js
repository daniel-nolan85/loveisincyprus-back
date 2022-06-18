const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const chatSchema = new mongoose.Schema(
  {
    users: [{ type: ObjectId, ref: 'User' }],
    latestMessage: { type: ObjectId, ref: 'Message' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Chat', chatSchema);
