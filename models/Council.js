const mongoose = require('mongoose');

const councilSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  heads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Head' }]
});

module.exports = mongoose.model('Council', councilSchema);