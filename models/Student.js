const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  council: { type: mongoose.Schema.Types.ObjectId, ref: 'Council' },
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'Head' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);