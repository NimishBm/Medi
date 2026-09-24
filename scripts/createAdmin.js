import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const EMAIL = 'admin@MediQ.com';
const PASSWORD = 'Admin@1234';

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const existing = await Admin.findOne({ email: EMAIL });
  if (existing) {
    console.log('Admin already exists:', EMAIL);
    await mongoose.disconnect();
    return;
  }

  const admin = new Admin({ name: 'Super Admin', email: EMAIL, password: PASSWORD });
  await admin.save();

  console.log('✅ Admin created successfully');
  console.log('   Email   :', EMAIL);
  console.log('   Password:', PASSWORD);

  await mongoose.disconnect();
}

createAdmin().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
