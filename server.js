require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

// ==================== AUTH ====================
const User = require('./models/User');
const { generateToken, authenticate, canEdit, isAdmin } = require('./middleware/auth');

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
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => res.sendFile(require('path').join(__dirname, 'public', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(require('path').join(__dirname, 'public', 'dashboard.html')));
app.get('/login', (req, res) => res.sendFile(require('path').join(__dirname, 'public', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(require('path').join(__dirname, 'public', 'signup.html')));

// ==================== AUTH ROUTES ====================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is disabled. Contact administrator.' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax'
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// Sign Up (Public - creates Delegate account by default)
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password, name } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Create user with Delegate role (only Admin can change roles)
    const user = await User.create({ 
      username, 
      password, 
      name: name || username,
      role: 'viewer'  // Default role for new signups
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(400).json({ error: err.message });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Check authentication status
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      name: req.user.name,
      role: req.user.role
    }
  });
});

// ==================== USER MANAGEMENT (Admin Only) ====================

// Get all users
app.get('/api/users', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create user (Admin only)
app.post('/api/users', authenticate, isAdmin, async (req, res) => {
  try {
    const { username, password, role, name } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.create({ username, password, role: role || 'viewer', name });
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(400).json({ error: err.message });
  }
});

// Update user (Admin only)
app.put('/api/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { role, isActive, name } = req.body;
    const updates = {};
    
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (name !== undefined) updates.name = name;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete user (Admin only)
app.delete('/api/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== COUNCILS ====================

// Get all councils (public - no auth required for reading)
app.get('/api/councils', async (req, res) => {
  try { res.json(await Council.find().sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Create council (requires authentication + editor/admin role)
app.post('/api/councils', authenticate, canEdit, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Council name is required' });
    const council = await Council.create({ name, description });
    res.status(201).json(council);
  } catch (err) {
    res.status(400).json({ error: err.code === 11000 ? 'Council already exists' : err.message });
  }
});

// Delete council (requires authentication + editor/admin role)
app.delete('/api/councils/:id', authenticate, canEdit, async (req, res) => {
  try {
    await Council.findByIdAndDelete(req.params.id);
    await Head.updateMany({ council: req.params.id }, { council: null });
    await Student.updateMany({ council: req.params.id }, { council: null });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== HEADS ====================

// Get all heads (public - no auth required for reading)
app.get('/api/heads', async (req, res) => {
  try { res.json(await Head.find().populate('council').sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Create head (requires authentication + editor/admin role)
app.post('/api/heads', authenticate, canEdit, async (req, res) => {
  try {
    const { name, email, councilId } = req.body;
    if (!name) return res.status(400).json({ error: 'Head name is required' });
    const head = await Head.create({ name, email, council: councilId || null });
    res.status(201).json(head);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Delete head (requires authentication + editor/admin role)
app.delete('/api/heads/:id', authenticate, canEdit, async (req, res) => {
  try {
    await Head.findByIdAndDelete(req.params.id);
    await Student.updateMany({ head: req.params.id }, { head: null });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== STUDENTS ====================

// Get all students (public - no auth required for reading)
app.get('/api/students', async (req, res) => {
  try { res.json(await Student.find().populate('council head').sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Create student (requires authentication + editor/admin role)
app.post('/api/students', authenticate, canEdit, async (req, res) => {
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

// Delete student (requires authentication + editor/admin role)
app.delete('/api/students/:id', authenticate, canEdit, async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== 404 HANDLER (MUST BE LAST) ====================

app.use((req, res) => {
  if (req.accepts('html')) {
    res.status(404).sendFile(require('path').join(__dirname, 'public', '404.html'));
  } else if (req.accepts('json')) {
    res.status(404).json({ error: 'Not Found' });
  } else {
    res.status(404).type('txt').send('404 Not Found');
  }
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
