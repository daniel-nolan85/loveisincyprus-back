const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
      unique: true,
      required: true,
    },
    role: {
      type: String,
      default: 'subscriber',
    },
    about: {},
    profileImage: {
      url: String,
      pulic_id: String,
    },
    coverImage: {
      url: String,
      pulic_id: String,
    },
    gender: String,
    location: String,
    genderWanted: String,
    relWanted: String,
    birthday: Date,
    following: [{ type: ObjectId, ref: 'User' }],
    followers: [{ type: ObjectId, ref: 'User' }],
    matches: [{ type: ObjectId, ref: 'User' }],
    nopes: [{ type: ObjectId, ref: 'User' }],
    visitors: [{ type: ObjectId, ref: 'User' }],
    profilePhotos: Array,
    coverPhotos: Array,
    uploadedPhotos: Array,
    cart: {
      type: Array,
      default: [],
    },
    address: Object,
    wishlist: [{ type: ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
