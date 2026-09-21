import express from 'express';
import Appointment from '../models/Appointment.js';
import Queue from '../models/Queue.js';
import Notification from '../models/Notification.js';
import { io } from '../index.js';

import { protect, authorize } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// Helper to generate token number for a given date and doctor
const generateTokenNumber = async (doctorId, appointmentDate) => {
  const startOfDay = new Date(appointmentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(appointmentDate);
  endOfDay.setHours(23, 59, 59, 999);

  const lastAppointment = await Appointment.findOne({
    doctorId,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ tokenNumber: -1 });

  return (lastAppointment?.tokenNumber || 0) + 1;
};

// Book appointment
router.post(
  '/',
  protect,
  authorize('PATIENT', 'RECEPTIONIST'),
  catchAsyncErrors(async (req, res) => {
    const { patientId, doctorId, appointmentDate, appointmentTime, reason, bookedFor, bookedBy, appointmentType } = req.body;

    if (!patientId || !doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check for duplicate booking
    const existingAppointment = await Appointment.findOne({
      patientId,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $ne: 'CANCELLED' },
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'Patient already has an appointment at this time' });
    }

    const tokenNumber = await generateTokenNumber(doctorId, new Date(appointmentDate));

    const appointment = new Appointment({
      patientId,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      reason,
      tokenNumber,
      status: 'BOOKED',
      bookedFor,
      bookedBy,
      appointmentType: appointmentType || 'General Consultation',
    });

    await appointment.save();
    await appointment.populate(['patientId', 'doctorId']);

    // Auto-create queue entry so doctor sees it in Live Queue immediately
    // Normalise queueDate to start-of-day UTC so the GET /doctor/:id filter always matches
    const queueDateNorm = new Date(appointmentDate);
    queueDateNorm.setUTCHours(0, 0, 0, 0);
    const queueEntry = new Queue({
      doctorId,
      appointmentId: appointment._id,
      patientId,
      tokenNumber,
      queueDate: queueDateNorm,
      status: 'WAITING',
    });
    await queueEntry.save();

    // Create a notification for the doctor
    const apptDate = new Date(appointmentDate).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
    await Notification.create({
      recipientId: doctorId,
      recipientModel: 'Doctor',
      appointmentId: appointment._id,
      type: 'NEW_APPOINTMENT',
      title: 'New Appointment Booked',
      message: `${appointment.patientId.name} booked a ${appointment.appointmentType} on ${apptDate} at ${appointmentTime}. Token #${tokenNumber}.`,
      data: { patientName: appointment.patientId.name, appointmentTime, appointmentDate, tokenNumber },
    });

    // Notify doctor via socket — emit to their personal notification room
    io.emit('queue-update', { doctorId });
    io.to(`notifications-${doctorId}`).emit('new-notification', {
      recipientId: String(doctorId),
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment,
    });
  })
);

// Get appointments
router.get(
  '/',
  protect,
  catchAsyncErrors(async (req, res) => {
    let filter = {};

    if (req.user.role === 'PATIENT') {
      filter = { $or: [{ patientId: req.user.id }, { bookedBy: req.user.id }] };
    } else if (req.user.role === 'DOCTOR') {
      filter.doctorId = req.user.id;
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', '-password')
      .populate('doctorId', '-password')
      .populate('bookedBy', '-password')
      .sort({ appointmentDate: -1 });

    res.json(appointments);
  })
);

// Get today's appointments for doctor
router.get(
  '/today',
  protect,
  authorize('DOCTOR', 'RECEPTIONIST'),
  catchAsyncErrors(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let filter = {
      appointmentDate: { $gte: today, $lt: tomorrow },
    };

    if (req.user.role === 'DOCTOR') {
      filter.doctorId = req.user.id;
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', '-password')
      .populate('doctorId', '-password')
      .sort({ appointmentTime: 1 });

    res.json(appointments);
  })
);

// Get appointment by ID
router.get(
  '/:id',
  protect,
  catchAsyncErrors(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', '-password')
      .populate('doctorId', '-password');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  })
);

// Update appointment
router.put(
  '/:id',
  protect,
  authorize('PATIENT', 'RECEPTIONIST', 'DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    Object.assign(appointment, req.body);
    await appointment.save();
    await appointment.populate(['patientId', 'doctorId']);

    res.json({
      message: 'Appointment updated successfully',
      appointment,
    });
  })
);

// Cancel appointment
router.post(
  '/:id/cancel',
  protect,
  catchAsyncErrors(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.status = 'CANCELLED';
    await appointment.save();

    res.json({
      message: 'Appointment cancelled successfully',
      appointment,
    });
  })
);

// Check in patient
router.post(
  '/:id/check-in',
  protect,
  authorize('RECEPTIONIST'),
  catchAsyncErrors(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.status = 'CHECKED_IN';
    appointment.checkInTime = new Date();
    await appointment.save();

    const tokenNumber = appointment.tokenNumber;
    const appointmentDate = appointment.appointmentDate;
    const doctorId = appointment.doctorId;

    // Create queue entry
    let queueEntry = await Queue.findOne({
      appointmentId: appointment._id,
    });

    if (!queueEntry) {
      queueEntry = new Queue({
        doctorId,
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        tokenNumber,
        queueDate: appointmentDate,
        status: 'WAITING',
      });
      await queueEntry.save();
    } else {
      // Already exists — just mark as WAITING in case it was in another state
      queueEntry.status = 'WAITING';
      await queueEntry.save();
    }

    io.emit('queue-update', { doctorId });

    res.json({
      message: 'Patient checked in successfully',
      appointment,
    });
  })
);

export default router;
