require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Username:', existingAdmin.username);
      console.log('Role:', existingAdmin.role);
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123', // Change this password after first login!
      role: 'admin',
      name: 'Administrator',
      isActive: true
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    console.log('\nYou can now login at: http://localhost:3000/login\n');

    // Create sample editor user
    const editorUser = await User.create({
      username: 'editor',
      password: 'editor123',
      role: 'editor',
      name: 'Editor User',
      isActive: true
    });

    console.log('✅ Editor user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Username: editor');
    console.log('Password: editor123');
    console.log('Role: editor (can add/edit/delete)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Create sample viewer user
    const viewerUser = await User.create({
      username: 'viewer',
      password: 'viewer123',
      role: 'viewer',
      name: 'Viewer User',
      isActive: true
    });

    console.log('✅ Viewer user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Username: viewer');
    console.log('Password: viewer123');
    console.log('Role: viewer (read-only access)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from database\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdminUser();
