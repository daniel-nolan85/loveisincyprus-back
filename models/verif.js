const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const verifSchema = new mongoose.Schema(
  {
    postedBy: {
      type: ObjectId,
      ref: 'User',
    },
    image: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Verif', verifSchema);
