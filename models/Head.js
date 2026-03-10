const mongoose = require('mongoose');

const headSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  council: { type: mongoose.Schema.Types.ObjectId, ref: 'Council' }
});

module.exports = mongoose.model('Head', headSchema);