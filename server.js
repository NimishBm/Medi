import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import 'express-async-errors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import queueRoutes from './routes/queue.js';
import consultationRoutes from './routes/consultations.js';
import prescriptionRoutes from './routes/prescriptions.js';
import paymentRoutes from './routes/payments.js';
import analyticsRoutes from './routes/analytics.js';
import searchRoutes from './routes/search.js';
import organizationRoutes from './routes/organizations.js';
import adminRoutes from './routes/admin.js';
import blogRoutes from './routes/blog.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Export io for use in routes
export const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Serverless / persistent DB connection handler
let connPromise = null;
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }
  if (!connPromise || mongoose.connection.readyState === 0) {
    connPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });
  }
  try {
    await connPromise;
  } catch (err) {
    connPromise = null; // reset promise so next request retries fresh connection
    throw err;
  }
  return mongoose.connection;
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    res.status(500).json({ message: 'Database connection failed: ' + err.message });
  }
});

// Static uploads & client build files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const clientDistPath = path.join(__dirname, 'client/dist');
app.use(express.static(clientDistPath));

// API Routes (supports both /api/* and /* fallback)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/doctors', doctorRoutes);
app.use('/doctors', doctorRoutes);

app.use('/api/appointments', appointmentRoutes);
app.use('/appointments', appointmentRoutes);

app.use('/api/queue', queueRoutes);
app.use('/queue', queueRoutes);

app.use('/api/consultations', consultationRoutes);
app.use('/consultations', consultationRoutes);

app.use('/api/prescriptions', prescriptionRoutes);
app.use('/prescriptions', prescriptionRoutes);

app.use('/api/payments', paymentRoutes);
app.use('/payments', paymentRoutes);

app.use('/api/analytics', analyticsRoutes);
app.use('/analytics', analyticsRoutes);

app.use('/api/search', searchRoutes);
app.use('/search', searchRoutes);

app.use('/api/organizations', organizationRoutes);
app.use('/organizations', organizationRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

app.use('/api/blog', blogRoutes);
app.use('/blog', blogRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/notifications', notificationRoutes);

// Health check and root API endpoint
app.get(['/api', '/api/'], (req, res) => {
  res.json({
    message: 'ClinicFlow API is running',
    status: 'OK',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      doctors: '/api/doctors',
      appointments: '/api/appointments',
      queue: '/api/queue',
      notifications: '/api/notifications',
      consultations: '/api/consultations',
      prescriptions: '/api/prescriptions',
      payments: '/api/payments',
      analytics: '/api/analytics',
      search: '/api/search',
      organizations: '/api/organizations',
      admin: '/api/admin',
      blog: '/api/blog',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', env: process.env.NODE_ENV || 'production' });
});
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// SPA catch-all route for frontend navigation
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Socket.IO events (used when running via node server.js)
io.on('connection', (socket) => {
  socket.on('join-notifications', (data) => {
    if (data?.userId) socket.join(`patient-${data.userId}`);
  });
  socket.on('join-doctor-notifications', (data) => {
    if (data?.doctorId) socket.join(`doctor-${data.doctorId}`);
  });
  socket.on('join-queue', (data) => {
    if (data?.doctorId) socket.join(`queue-${data.doctorId}`);
  });
  socket.on('leave-queue', (data) => {
    if (data?.doctorId) socket.leave(`queue-${data.doctorId}`);
  });
  socket.on('disconnect', () => {});
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// Start local server if run directly
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
