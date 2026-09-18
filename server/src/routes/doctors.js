import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads', 'doctors');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `doctor-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all doctors
router.get(
  '/',
  catchAsyncErrors(async (req, res) => {
    const doctors = await User.find({ role: 'DOCTOR', isActive: true }).select('-password');
    res.json(doctors);
  })
);

// Get doctor by ID
router.get(
  '/:id',
  catchAsyncErrors(async (req, res) => {
    const doctor = await User.findById(req.params.id).select('-password');
    if (!doctor || doctor.role !== 'DOCTOR') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json(doctor);
  })
);

// Get doctor details (protected)
router.get(
  '/:id/details',
  protect,
  catchAsyncErrors(async (req, res) => {
    const doctor = await User.findById(req.params.id).select('-password');
    if (!doctor || doctor.role !== 'DOCTOR') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json(doctor);
  })
);

// Upload profile photo
router.post(
  '/upload-photo',
  protect,
  authorize('DOCTOR'),
  upload.single('profilePhoto'),
  catchAsyncErrors(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/doctors/${req.file.filename}`;

    const doctor = await User.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: fileUrl },
      { new: true }
    ).select('-password');

    // Return full URL for frontend
    const fullUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;

    res.json({
      message: 'Photo uploaded successfully',
      profilePhoto: fullUrl,
      user: doctor.toJSON()
    });
  })
);

// Update doctor's own profile
router.put(
  '/me',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const allowedFields = [
      'specialization', 'consultationFee', 'videoConsultationFee', 'roomNumber',
      'qualifications', 'boardCertifications', 'specializations', 'experience',
      'availability', 'isActive', 'phone', 'aboutMe', 'treatments', 'languages',
      'achievements', 'registrationNumber', 'hospital', 'address', 'city', 'state',
      'zipCode', 'insurance', 'website', 'consultationDuration', 'onlineConsultation',
      'emergencyConsultation', 'waitingTime', 'patientsSeen', 'successRate', 'rating',
      'profilePhoto', 'breaks', 'bufferTime', 'maxPatientsPerDay', 'allowSameDayBooking',
      'minBookingNotice'
    ];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const doctor = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
    res.json(doctor.toJSON());
  })
);

export default router;
