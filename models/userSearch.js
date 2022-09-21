const mongoose = require('mongoose');

const userSearchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    params: [{ type: Object, required: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserSearch', userSearchSchema);
