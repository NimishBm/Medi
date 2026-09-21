import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import 'express-async-errors';
import dotenv from 'dotenv';

// Routes
import authRoutes from '../server/src/routes/auth.js';
import doctorRoutes from '../server/src/routes/doctors.js';
import appointmentRoutes from '../server/src/routes/appointments.js';
import queueRoutes from '../server/src/routes/queue.js';
import consultationRoutes from '../server/src/routes/consultations.js';
import prescriptionRoutes from '../server/src/routes/prescriptions.js';
import paymentRoutes from '../server/src/routes/payments.js';
import analyticsRoutes from '../server/src/routes/analytics.js';
import searchRoutes from '../server/src/routes/search.js';
import organizationRoutes from '../server/src/routes/organizations.js';
import adminRoutes from '../server/src/routes/admin.js';
import blogRoutes from '../server/src/routes/blog.js';
import notificationRoutes from '../server/src/routes/notifications.js';

dotenv.config();

// Export io placeholder so existing route imports don't break
export const io = null;

const app = express();

app.use(cors());
app.use(express.json());

// Reusable connection caching for serverless environments
let cachedConnection = null;

let connPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is missing on serverless environment');
  }
  if (!connPromise) {
    connPromise = mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
  }
  await connPromise;
  return mongoose.connection;
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    res.status(500).json({
      message: 'Database connection failed: ' + (err.message || err),
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? err.message : err.stack,
  });
});

export default app;
