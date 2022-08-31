const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const verifSchema = new mongoose.Schema(
  {
    postedBy: {
      type: ObjectId,
      ref: 'User',
    },
    image: {
      url: String,
      pulic_id: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Verif', verifSchema);
