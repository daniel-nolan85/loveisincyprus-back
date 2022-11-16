const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const messageSchema = new mongoose.Schema(
  {
    sender: { type: ObjectId, ref: 'User' },
    content: { type: String, trim: true },
    chat: { type: ObjectId, ref: 'Chat' },
    reported: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
