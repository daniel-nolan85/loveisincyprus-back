const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: 'Name is required',
      minlength: [2, 'Event name is too short'],
      maxlength: [50, 'Event name is too long'],
    },
    location: Object,
    when: Date,
    notes: {
      type: String,
      trim: true,
      minlength: [2, 'Event description is too short'],
      maxlength: [2000, 'Event description is too long'],
    },
    invitees: [{ type: Object, ref: 'User' }],
    accepted: [{ type: ObjectId, ref: 'User' }],
    maybe: [{ type: ObjectId, ref: 'User' }],
    declined: [{ type: ObjectId, ref: 'User' }],
    cancelled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
