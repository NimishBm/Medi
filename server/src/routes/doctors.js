import express from 'express';
import Doctor from '../models/Doctor.js';
import Organization from '../models/Organization.js';
import { protect, authorize } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// Get all doctors
router.get(
  '/',
  catchAsyncErrors(async (req, res) => {
    const doctors = await Doctor.find({ isActive: true })
      .select('-password')
      .populate('organizationId', 'name orgId');
    res.json(doctors);
  })
);

// Get distinct specializations actually present in the Doctors collection
router.get(
  '/specializations',
  catchAsyncErrors(async (req, res) => {
    const specializations = await Doctor.distinct('specialization', {
      isActive: true
    });

    res.json(specializations.filter(Boolean).sort());
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

// Doctor requests to join an org using the orgId code
router.post(
  '/me/request-join',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const { orgId } = req.body;

    if (!orgId) {
      return res.status(400).json({ message: 'Please provide an orgId' });
    }

    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.orgMembershipStatus === 'APPROVED') {
      return res.status(400).json({ message: 'You are already a member of an organization' });
    }

    if (doctor.orgMembershipStatus === 'PENDING') {
      return res.status(400).json({ message: 'You already have a pending join request' });
    }

    const org = await Organization.findOne({ orgId });
    if (!org) {
      return res.status(404).json({ message: 'Organization not found. Please check the Org ID.' });
    }

    doctor.pendingOrgId = org._id;
    doctor.orgMembershipStatus = 'PENDING';
    await doctor.save();

    res.json({ message: `Join request sent to ${org.name}. Awaiting approval.` });
  })
);

// Doctor cancels their pending join request
router.delete(
  '/me/request-join',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    if (doctor.orgMembershipStatus !== 'PENDING') {
      return res.status(400).json({ message: 'No pending request to cancel' });
    }

    doctor.pendingOrgId = null;
    doctor.orgMembershipStatus = 'NONE';
    await doctor.save();

    res.json({ message: 'Join request cancelled' });
  })
);

export default router;