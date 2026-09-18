import express from 'express';
import Queue from '../models/Queue.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Consultation from '../models/Consultation.js';
import { protect, authorize } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';
import { io } from '../index.js';

const router = express.Router();

// Get queue for a doctor
router.get(
  '/doctor/:doctorId',
  protect,
  catchAsyncErrors(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const queue = await Queue.find({
      doctorId: req.params.doctorId,
      queueDate: { $gte: today, $lt: tomorrow },
    })
      .populate('patientId', 'name phone email')
      .sort({ status: 1, tokenNumber: 1 });

    const stats = {
      total: queue.length,
      waiting: queue.filter((q) => q.status === 'WAITING').length,
      called: queue.filter((q) => q.status === 'CALLED').length,
      consulting: queue.filter((q) => q.status === 'CONSULTING').length,
      completed: queue.filter((q) => q.status === 'COMPLETED').length,
      skipped: queue.filter((q) => q.status === 'SKIPPED').length,
    };

    res.json({ queue, stats });
  })
);

// Call next patient
router.post(
  '/call-next',
  protect,
  authorize('DOCTOR', 'RECEPTIONIST'),
  catchAsyncErrors(async (req, res) => {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextPatient = await Queue.findOne({
      doctorId,
      queueDate: { $gte: today, $lt: tomorrow },
      status: 'WAITING',
    }).sort({ tokenNumber: 1 });

    if (!nextPatient) {
      return res.status(404).json({ message: 'No patients waiting' });
    }

    nextPatient.status = 'CALLED';
    nextPatient.calledAt = new Date();
    await nextPatient.save();

    const appointment = await Appointment.findById(nextPatient.appointmentId);

    appointment.status = 'CALLED';
    appointment.calledTime = new Date();
    await appointment.save();

    const patientData = await nextPatient.populate(
      'patientId',
      'name phone email'
    );

    io.emit('queue-update', {
      doctorId,
      nextPatient: patientData,
    });

    res.json({
      message: 'Next patient called',
      nextPatient: patientData,
    });
  })
);

// Skip patient
router.post(
  '/skip',
  protect,
  authorize('DOCTOR', 'RECEPTIONIST'),
  catchAsyncErrors(async (req, res) => {
    const { queueId } = req.body;

    if (!queueId) {
      return res.status(400).json({ message: 'Queue ID is required' });
    }

    const queueEntry = await Queue.findById(queueId);

    if (!queueEntry) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    queueEntry.status = 'SKIPPED';
    queueEntry.skippedAt = new Date();
    await queueEntry.save();

    const appointment = await Appointment.findById(queueEntry.appointmentId);

    appointment.status = 'SKIPPED';
    await appointment.save();

    io.emit('queue-update', {
      doctorId: queueEntry.doctorId,
    });

    res.json({
      message: 'Patient skipped',
    });
  })
);

// Recall patient
router.post(
  '/recall',
  protect,
  authorize('RECEPTIONIST'),
  catchAsyncErrors(async (req, res) => {
    const { queueId } = req.body;

    if (!queueId) {
      return res.status(400).json({ message: 'Queue ID is required' });
    }

    const queueEntry = await Queue.findById(queueId);

    if (!queueEntry) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    queueEntry.status = 'WAITING';
    await queueEntry.save();

    io.emit('queue-update', {
      doctorId: queueEntry.doctorId,
    });

    res.json({
      message: 'Patient recalled',
    });
  })
);

// Start consultation
router.post(
  '/start-consultation',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const { queueId } = req.body;

    if (!queueId) {
      return res.status(400).json({ message: 'Queue ID is required' });
    }

    const queueEntry = await Queue.findById(queueId);

    if (!queueEntry) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    queueEntry.status = 'CONSULTING';
    queueEntry.consultationStartAt = new Date();
    await queueEntry.save();

    const appointment = await Appointment.findById(queueEntry.appointmentId);

    appointment.status = 'CONSULTING';
    appointment.consultationStartTime = new Date();
    await appointment.save();

    io.emit('queue-update', {
      doctorId: queueEntry.doctorId,
    });

    res.json({
      message: 'Consultation started',
    });
  })
);

// Complete consultation
router.post(
  '/complete-consultation',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const { queueId } = req.body;

    if (!queueId) {
      return res.status(400).json({ message: 'Queue ID is required' });
    }

    const queueEntry = await Queue.findById(queueId);

    if (!queueEntry) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    const consultationEndTime = new Date();

    queueEntry.status = 'COMPLETED';
    queueEntry.consultationEndAt = consultationEndTime;

    if (queueEntry.consultationStartAt) {
      const duration =
        (consultationEndTime - queueEntry.consultationStartAt) / 60000;

      queueEntry.consultationDuration = Math.round(duration);
    }

    await queueEntry.save();

    const appointment = await Appointment.findById(queueEntry.appointmentId);

    appointment.status = 'COMPLETED';
    appointment.consultationEndTime = consultationEndTime;
    await appointment.save();

    // Update doctor's average consultation time
    const doctor = await Doctor.findById(queueEntry.doctorId);

    if (doctor && queueEntry.consultationDuration) {
      const consultations = await Queue.find({
        doctorId: queueEntry.doctorId,
        status: 'COMPLETED',
        consultationDuration: { $exists: true },
      });

      const totalDuration = consultations.reduce(
        (sum, q) => sum + q.consultationDuration,
        0
      );

      doctor.averageConsultationTime = Math.round(
        totalDuration / consultations.length
      );

      await doctor.save();
    }

    io.emit('queue-update', {
      doctorId: queueEntry.doctorId,
    });

    res.json({
      message: 'Consultation completed',
      queueEntry,
    });
  })
);

// Mark as no-show
router.post(
  '/no-show',
  protect,
  authorize('DOCTOR', 'RECEPTIONIST'),
  catchAsyncErrors(async (req, res) => {
    const { queueId } = req.body;

    if (!queueId) {
      return res.status(400).json({ message: 'Queue ID is required' });
    }

    const queueEntry = await Queue.findById(queueId);

    if (!queueEntry) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    queueEntry.status = 'NO_SHOW';
    queueEntry.noShowAt = new Date();
    await queueEntry.save();

    const appointment = await Appointment.findById(queueEntry.appointmentId);

    appointment.status = 'NO_SHOW';
    await appointment.save();

    io.emit('queue-update', {
      doctorId: queueEntry.doctorId,
    });

    res.json({
      message: 'Patient marked as no-show',
    });
  })
);

export default router;