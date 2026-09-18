import express from 'express';
import Doctor from '../models/Doctor.js';
import { protect, authorize } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// Get all doctors
router.get(
  '/',
  catchAsyncErrors(async (req, res) => {
    const doctors = await Doctor.find({ isActive: true }).select('-password');
    res.json(doctors);
  })
);

// Get doctor by ID
router.get(
  '/:id',
  catchAsyncErrors(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id).select('-password');

    if (!doctor) {
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
    const doctor = await Doctor.findById(req.params.id).select('-password');

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found'
      });
    }

    res.json(doctor);
  })
);

// Update doctor's own profile
router.put(
  '/me',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const allowedFields = [
      'specialization',
      'consultationFee',
      'roomNumber',
      'qualifications',
      'experience',
      'availability',
      'isActive',
      'phone',
      'clinicLocation',
      'consultationType'
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
        runValidators: true
      }
    ).select('-password');

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found'
      });
    }

    res.json(doctor.toJSON());
  })
);

export default router;