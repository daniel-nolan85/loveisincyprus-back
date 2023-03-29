const mongoose = require('mongoose');

const adSchema = new mongoose.Schema(
  {
    content: {
      type: {},
      required: true,
    },
    image: {
      url: String,
      public_id: String,
    },
    hyperlink: String,
    duration: String,
    status: String,
    demographic: [{ type: String }],
    contactInfo: Object,
    accountInfo: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ad', adSchema);
