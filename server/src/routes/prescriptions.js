import express from 'express';
import Prescription from '../models/Prescription.js';
import { protect, authorize } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// Create prescription
router.post(
  '/',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const { consultationId, patientId, medicines, additionalNotes, validTill } = req.body;

    if (!patientId || !medicines || medicines.length === 0) {
      return res.status(400).json({ message: 'Patient and at least one medicine are required' });
    }

    const prescription = new Prescription({
      consultationId: consultationId || undefined,
      patientId,
      doctorId: req.user.id,
      medicines,
      additionalNotes,
      validTill,
    });

    await prescription.save();

    const populated = await Prescription.findById(prescription._id)
      .populate('patientId', 'name email phone');

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription: populated,
    });
  })
);

// Get prescriptions written by logged-in doctor
router.get(
  '/doctor',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const prescriptions = await Prescription.find({ doctorId: req.user.id })
      .populate('patientId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  })
);

// Get prescriptions for patient
router.get(
  '/patient/:patientId',
  protect,
  catchAsyncErrors(async (req, res) => {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId })
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  })
);

// Get prescription by ID
router.get(
  '/:id',
  protect,
  catchAsyncErrors(async (req, res) => {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctorId', 'name specialization phone email');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json(prescription);
  })
);

export default router;
