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
    const { consultationId, patientId, doctorId, medicines, additionalNotes, validTill } = req.body;

    if (!consultationId || !medicines) {
      return res.status(400).json({ message: 'Consultation ID and medicines are required' });
    }

    const prescription = new Prescription({
      consultationId,
      patientId,
      doctorId,
      medicines,
      additionalNotes,
      validTill,
    });

    await prescription.save();

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription,
    });
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
