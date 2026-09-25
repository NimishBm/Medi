import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Doctor from '../models/Doctor.js';
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

// Get all doctors (hide REJECTED, show APPROVED and PENDING)
router.get(
  '/',
  catchAsyncErrors(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5000;
    const skip = (page - 1) * limit;

    const doctors = await Doctor.find({ isActive: true ,verificationStatus: { $ne: 'REJECTED' }})
      .select('name specialization consultationFee profilePhoto averageRating totalReviews experience organizationId')
      .populate('organizationId', 'name city type logo')
      .lean()
      .skip(skip)
      .limit(limit)
      .sort({ averageRating: -1, createdAt: -1 });

    const total = await Doctor.countDocuments({ isActive: true });

    res.set('Cache-Control', 'public, max-age=600');
    res.json({
      doctors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// Get distinct specializations actually present in the Doctors collection
router.get(
  '/specializations',
  catchAsyncErrors(async (req, res) => {
    const specializations = await Doctor.distinct('specialization', {
      isActive: true,
      verificationStatus: { $ne: 'REJECTED' }
    });

    res.json(specializations.filter(Boolean).sort());
  })
);

// Get doctor by ID
router.get(
  '/:id',
  catchAsyncErrors(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id)
      .select('-password')
      .populate('organizationId', 'name city type logo')
      .lean();

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found'
      });
    }

    res.set('Cache-Control', 'public, max-age=600');
    if (doctor.verificationStatus === 'REJECTED') {
      return res.status(404).json({
        message: 'Doctor not found'
      });
    }

    res.json(doctor);
  })
);

// Get doctor details
router.get(
  '/:id/details',
  protect,
  catchAsyncErrors(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id)
      .select('-password')
      .populate('organizationId', 'name city type logo');

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found'
      });
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

    const doctor = await Doctor.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: fileUrl },
      { new: true }
    ).select('-password');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Return full URL for frontend
    const fullUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;

    res.json({
      message: 'Photo uploaded successfully',
      profilePhoto: fullUrl,
      user: { ...doctor.toJSON(), profilePhoto: fullUrl, role: 'DOCTOR' }
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
      'minBookingNotice', 'clinicLocation', 'clinicName', 'clinicAddress', 'clinicCity',
      'clinicPhone', 'availabilityStart', 'availabilityEnd', 'daysOff', 'consultationType',
      'wpSiteUrl', 'wpUsername', 'wpAppPassword'
    ];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const doctor = await Doctor.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,
        runValidators: false
      }
    ).select('-password');

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found'
      });
    }

    res.json({ ...doctor.toJSON(), role: 'DOCTOR' });
  })
);

export default router;