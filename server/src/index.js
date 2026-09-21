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

console.log('Mongo URI loaded:', !!process.env.MONGO_URI);
const app = express();
const server = http.createServer(app);

// Export io for use in routes
export const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve static frontend in production
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('MongoDB connected');
  console.log('Database:', mongoose.connection.name);
  console.log('Doctors count:', await mongoose.connection.collection('Doctors').countDocuments());
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

// Socket.IO events
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Doctor/patient joins their personal notification room
  socket.on('join-notifications', (data) => {
    socket.join(`notifications-${data.userId}`);
  });

  socket.on('join-queue', (data) => {
    socket.join(`queue-${data.doctorId}`);
  });

  socket.on('join-notifications', (data) => {
    if (data?.userId) socket.join(`patient-${data.userId}`);
  });

  socket.on('join-doctor-notifications', (data) => {
    if (data?.doctorId) socket.join(`doctor-${data.doctorId}`);
  });

  socket.on('leave-queue', (data) => {
    socket.leave(`queue-${data.doctorId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
