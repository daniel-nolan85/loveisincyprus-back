const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema({
  country: String,
  callingCode: String,
  permitted: String,
});

module.exports = mongoose.model('CallingCode', codeSchema);
