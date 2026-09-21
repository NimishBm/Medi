import express from 'express';
import Consultation from '../models/Consultation.js';
import Appointment from '../models/Appointment.js';
import { protect, authorize } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// Create consultation note (doctor only)
router.post(
  '/',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const { appointmentId, patientId, symptoms, diagnosis, treatmentPlan, followUpDate, followUpNotes } = req.body;

    if (!appointmentId || !patientId) {
      return res.status(400).json({ message: 'appointmentId and patientId are required' });
    }

    // Upsert: one consultation per appointment
    let consultation = await Consultation.findOne({ appointmentId });
    if (consultation) {
      Object.assign(consultation, { symptoms, diagnosis, treatmentPlan, followUpDate, followUpNotes });
      await consultation.save();
    } else {
      consultation = await Consultation.create({
        appointmentId,
        patientId,
        doctorId: req.user.id,
        symptoms: Array.isArray(symptoms) ? symptoms : symptoms ? [symptoms] : [],
        diagnosis,
        treatmentPlan,
        followUpDate,
        followUpNotes,
      });
    }

    res.status(201).json({ message: 'Consultation saved', consultation });
  })
);

// Get all consultations for a patient
router.get(
  '/patient/:patientId',
  protect,
  catchAsyncErrors(async (req, res) => {
    const consultations = await Consultation.find({ patientId: req.params.patientId })
      .populate('doctorId', 'name specialization')
      .populate('appointmentId', 'appointmentDate appointmentTime appointmentType tokenNumber')
      .sort({ createdAt: -1 });
    res.json(consultations);
  })
);

// Get all consultations by a doctor
router.get(
  '/doctor/:doctorId',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const consultations = await Consultation.find({ doctorId: req.params.doctorId })
      .populate('patientId', 'name phone email')
      .populate('appointmentId', 'appointmentDate appointmentTime tokenNumber')
      .sort({ createdAt: -1 });
    res.json(consultations);
  })
);

// Get single consultation
router.get(
  '/:id',
  protect,
  catchAsyncErrors(async (req, res) => {
    const consultation = await Consultation.findById(req.params.id)
      .populate('doctorId', 'name specialization phone email')
      .populate('patientId', 'name phone email')
      .populate('appointmentId');

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }
    res.json(consultation);
  })
);

// Update consultation note (doctor only, own records)
router.put(
  '/:id',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }
    if (consultation.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { symptoms, diagnosis, treatmentPlan, followUpDate, followUpNotes } = req.body;
    if (symptoms !== undefined) consultation.symptoms = Array.isArray(symptoms) ? symptoms : [symptoms];
    if (diagnosis !== undefined) consultation.diagnosis = diagnosis;
    if (treatmentPlan !== undefined) consultation.treatmentPlan = treatmentPlan;
    if (followUpDate !== undefined) consultation.followUpDate = followUpDate;
    if (followUpNotes !== undefined) consultation.followUpNotes = followUpNotes;
    await consultation.save();
    res.json({ message: 'Consultation updated', consultation });
  })
);

export default router;
