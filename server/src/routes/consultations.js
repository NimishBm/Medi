import express from 'express';
import Consultation from '../models/Consultation.js';
import Appointment from '../models/Appointment.js';
import { protect, authorize } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// Create consultation
router.post(
  '/',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const { appointmentId, symptoms, diagnosis, notes, treatmentPlan, followUpDate } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: 'Appointment ID is required' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const consultation = new Consultation({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      symptoms,
      diagnosis,
      notes,
      treatmentPlan,
      followUpDate,
    });

    await consultation.save();

    res.status(201).json({
      message: 'Consultation created successfully',
      consultation,
    });
  })
);

// Get consultations for patient
router.get(
  '/patient/:patientId',
  protect,
  catchAsyncErrors(async (req, res) => {
    const consultations = await Consultation.find({ patientId: req.params.patientId })
      .populate('doctorId', 'name specialization roomNumber')
      .sort({ createdAt: -1 });

    res.json(consultations);
  })
);

// Get consultations for doctor
router.get(
  '/doctor/:doctorId',
  protect,
  catchAsyncErrors(async (req, res) => {
    const consultations = await Consultation.find({ doctorId: req.params.doctorId })
      .populate('patientId', 'name email phone gender dateOfBirth allergies')
      .sort({ createdAt: -1 });

    res.json(consultations);
  })
);

// Get consultation by ID
router.get(
  '/:id',
  protect,
  catchAsyncErrors(async (req, res) => {
    const consultation = await Consultation.findById(req.params.id)
      .populate('patientId', 'name email phone dateOfBirth')
      .populate('doctorId', 'name specialization roomNumber');

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    res.json(consultation);
  })
);

// Update consultation
router.put(
  '/:id',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    Object.assign(consultation, req.body);
    await consultation.save();

    res.json({
      message: 'Consultation updated successfully',
      consultation,
    });
  })
);

export default router;
