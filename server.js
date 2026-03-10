require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// ==================== MODELS ====================

const councilSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' }
}, { timestamps: true });

const headSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: '' },
  council: { type: mongoose.Schema.Types.ObjectId, ref: 'Council', default: null }
}, { timestamps: true });

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  role: { type: String, enum: ['Director', 'Head', 'Delegate'], required: true },
  council: { type: mongoose.Schema.Types.ObjectId, ref: 'Council', default: null },
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'Head', default: null }
}, { timestamps: true });

const Council = mongoose.model('Council', councilSchema);
const Head = mongoose.model('Head', headSchema);
const Student = mongoose.model('Student', studentSchema);

// ==================== APP ====================

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => res.sendFile(require('path').join(__dirname, 'public', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(require('path').join(__dirname, 'public', 'dashboard.html')));

// 404 Handler (must be last)
app.use((req, res) => {
  if (req.accepts('html')) {
    res.status(404).sendFile(require('path').join(__dirname, 'public', '404.html'));
  } else if (req.accepts('json')) {
    res.status(404).json({ error: 'Not Found' });
  } else {
    res.status(404).type('txt').send('404 Not Found');
  }
});

// ==================== COUNCILS ====================

app.get('/api/councils', async (req, res) => {
  try { res.json(await Council.find().sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/councils', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Council name is required' });
    const council = await Council.create({ name, description });
    res.status(201).json(council);
  } catch (err) {
    res.status(400).json({ error: err.code === 11000 ? 'Council already exists' : err.message });
  }
});

app.delete('/api/councils/:id', async (req, res) => {
  try {
    await Council.findByIdAndDelete(req.params.id);
    await Head.updateMany({ council: req.params.id }, { council: null });
    await Student.updateMany({ council: req.params.id }, { council: null });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== HEADS ====================

app.get('/api/heads', async (req, res) => {
  try { res.json(await Head.find().populate('council').sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/heads', async (req, res) => {
  try {
    const { name, email, councilId } = req.body;
    if (!name) return res.status(400).json({ error: 'Head name is required' });
    const head = await Head.create({ name, email, council: councilId || null });
    res.status(201).json(head);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/heads/:id', async (req, res) => {
  try {
    await Head.findByIdAndDelete(req.params.id);
    await Student.updateMany({ head: req.params.id }, { head: null });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== STUDENTS ====================

app.get('/api/students', async (req, res) => {
  try { res.json(await Student.find().populate('council head').sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, studentId, role, councilId, headId } = req.body;
    if (!name || !studentId) return res.status(400).json({ error: 'Name and Student ID are required' });
    if (!role) return res.status(400).json({ error: 'Role is required' });
    const student = await Student.create({ name, studentId, role, council: councilId || null, head: headId || null });
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.code === 11000 ? 'Student ID already exists' : err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== START ====================

const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });