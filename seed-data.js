require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    seedData();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
});

// Define Schemas
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

async function seedData() {
    try {
        // Read existing data from db.json
        const dbData = JSON.parse(fs.readFileSync('db.json', 'utf8'));
        
        // Add sample councils (if db.json is empty, create some)
        const sampleCouncils = [
            { name: 'Technology Council', description: 'Handles all tech-related activities' },
            { name: 'Media Council', description: 'Manages media and communications' },
            { name: 'Events Council', description: 'Organizes student events' }
        ];
        
        console.log('\n📋 Creating Councils...');
        const councils = [];
        for (const councilData of sampleCouncils) {
            const existing = await Council.findOne({ name: councilData.name });
            if (!existing) {
                const council = await Council.create(councilData);
                console.log(`   ✅ ${council.name}`);
                councils.push(council);
            } else {
                console.log(`   ⏭️  ${existing.name} (already exists)`);
                councils.push(existing);
            }
        }
        
        // Add sample heads
        const sampleHeads = [
            { name: 'Ahmed Ali', email: 'ahmed@example.com', council: councils[0]._id },
            { name: 'Sara Mohamed', email: 'sara@example.com', council: councils[1]._id },
            { name: 'Omar Hassan', email: 'omar@example.com', council: councils[2]._id }
        ];
        
        console.log('\n👤 Creating Heads...');
        const heads = [];
        for (const headData of sampleHeads) {
            const existing = await Head.findOne({ name: headData.name });
            if (!existing) {
                const head = await Head.create(headData);
                console.log(`   ✅ ${head.name}`);
                heads.push(head);
            } else {
                console.log(`   ⏭️  ${existing.name} (already exists)`);
                heads.push(existing);
            }
        }
        
        // Add sample students/members
        const sampleStudents = [
            { name: 'Mohamed Osama', studentId: '1001', role: 'Director', council: councils[0]._id, head: heads[0]._id },
            { name: 'Fatma Ali', studentId: '1002', role: 'Head', council: councils[1]._id, head: heads[1]._id },
            { name: 'Khaled Ahmed', studentId: '1003', role: 'Delegate', council: councils[0]._id, head: heads[0]._id },
            { name: 'Nour Hassan', studentId: '1004', role: 'Delegate', council: councils[1]._id, head: heads[1]._id },
            { name: 'Youssef Mahmoud', studentId: '1005', role: 'Director', council: councils[2]._id, head: heads[2]._id },
            { name: 'Mona Samir', studentId: '1006', role: 'Delegate', council: councils[2]._id, head: heads[2]._id }
        ];
        
        // Add existing student from db.json if exists
        if (dbData.students && dbData.students.length > 0) {
            for (const s of dbData.students) {
                sampleStudents.push({
                    name: s.name,
                    studentId: s.studentId,
                    role: s.role,
                    council: s.councilId ? councils[0]._id : null,
                    head: s.headId ? heads[0]._id : null
                });
            }
        }
        
        console.log('\n👥 Creating Members...');
        for (const studentData of sampleStudents) {
            const existing = await Student.findOne({ studentId: studentData.studentId });
            if (!existing) {
                const student = await Student.create(studentData);
                console.log(`   ✅ ${student.name} (${student.role})`);
            } else {
                console.log(`   ⏭️  ${existing.name} (already exists)`);
            }
        }
        
        // Show summary
        const totalCouncils = await Council.countDocuments();
        const totalHeads = await Head.countDocuments();
        const totalStudents = await Student.countDocuments();
        const totalDirectors = await Student.countDocuments({ role: 'Director' });
        const totalRoleHeads = await Student.countDocuments({ role: 'Head' });
        const totalDelegates = await Student.countDocuments({ role: 'Delegate' });
        
        console.log('\n📊 Database Summary:');
        console.log(`   📋 Councils: ${totalCouncils}`);
        console.log(`   👤 Heads: ${totalHeads}`);
        console.log(`   👥 Total Members: ${totalStudents}`);
        console.log(`   🔷 Directors: ${totalDirectors}`);
        console.log(`   🔶 Heads: ${totalRoleHeads}`);
        console.log(`   🔹 Delegates: ${totalDelegates}`);
        
        console.log('\n✅ Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error.message);
        process.exit(1);
    }
}
