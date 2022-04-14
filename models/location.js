const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  country: String,
  countryCode: String,
  whitelist: String,
});

module.exports = mongoose.model('Location', locationSchema);
