import express from 'express';
import mongoose from 'mongoose';
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

// Book appointment(s)
// Supports single booking (bookedFor object) or group booking (attendees array).
// Each attendee gets their own appointment document with its own token number.
// All appointments in the same request share a groupBookingId.
router.post(
  '/',
  protect,
  authorize('PATIENT', 'DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const { patientId, doctorId, appointmentDate, appointmentTime, reason, bookedFor, bookedBy, appointmentType, attendees } = req.body;

    if (!patientId || !doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Build the list of attendees to create appointments for.
    // If `attendees` array is provided use it, otherwise fall back to single bookedFor (or self).
    const attendeeList = attendees && attendees.length > 0
      ? attendees
      : [bookedFor || { isFamilyMember: false }];

    // Generate a shared groupBookingId only when booking for multiple people
    const groupBookingId = attendeeList.length > 1
      ? new mongoose.Types.ObjectId().toString()
      : undefined;

    const createdAppointments = [];

    const queueDateNorm = new Date(appointmentDate);
    queueDateNorm.setUTCHours(0, 0, 0, 0);

    for (const attendee of attendeeList) {
      // Each person gets their own token
      const tokenNumber = await generateTokenNumber(doctorId, new Date(appointmentDate));

      // Check for duplicate booking for this patientId + slot
      const existingAppointment = await Appointment.findOne({
        patientId,
        doctorId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        status: { $ne: 'CANCELLED' },
        'bookedFor.name': attendee.isFamilyMember ? attendee.name : null,
        'bookedFor.isFamilyMember': attendee.isFamilyMember || false,
      });

      if (existingAppointment) {
        const who = attendee.isFamilyMember ? attendee.name : 'Patient';
        return res.status(400).json({ message: `${who} already has an appointment at this time` });
      }

      const appointment = new Appointment({
        patientId,
        doctorId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        reason,
        tokenNumber,
        status: 'BOOKED',
        bookedFor: attendee,
        bookedBy,
        appointmentType: appointmentType || 'General Consultation',
        groupBookingId,
      });

      await appointment.save();
      await appointment.populate(['patientId', 'doctorId']);
      createdAppointments.push(appointment);

      // Auto-create queue entry so doctor sees it in Live Queue immediately
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
      const attendeeDisplayName = attendee.isFamilyMember && attendee.name
        ? `${attendee.name} (${appointment.patientId.name}'s ${attendee.relationship || 'family'})`
        : appointment.patientId.name;

      await Notification.create({
        recipientId: doctorId,
        recipientModel: 'Doctor',
        appointmentId: appointment._id,
        type: 'NEW_APPOINTMENT',
        title: 'New Appointment Booked',
        message: `${attendeeDisplayName} booked a ${appointment.appointmentType} on ${apptDate} at ${appointmentTime}. Token #${tokenNumber}.`,
        data: { patientName: attendeeDisplayName, appointmentTime, appointmentDate, tokenNumber },
      });
    }

    // Notify doctor via socket — emit to their personal notification room & global queue listeners
    io.emit('queue-update', { doctorId });
    io.to(`notifications-${doctorId}`).emit('new-notification', {
      recipientId: String(doctorId),
    });

    // Return single object for single booking, array for group booking (backward compatible)
    if (createdAppointments.length === 1) {
      return res.status(201).json({
        message: 'Appointment booked successfully',
        appointment: createdAppointments[0],
      });
    }

    res.status(201).json({
      message: `${createdAppointments.length} appointments booked successfully`,
      appointments: createdAppointments,
      groupBookingId,
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
  authorize('DOCTOR'),
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
  authorize('PATIENT', 'DOCTOR'),
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

    // Delete or update queue entry to reflect cancellation
    await Queue.deleteMany({ appointmentId: appointment._id });
    io.emit('queue-update', { doctorId: appointment.doctorId });

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
  authorize('DOCTOR', 'PATIENT'),
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

    const queueDateNorm = new Date(appointmentDate);
    queueDateNorm.setUTCHours(0, 0, 0, 0);

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
        queueDate: queueDateNorm,
        status: 'WAITING',
      });
      await queueEntry.save();
    } else {
      // Already exists — just mark as WAITING in case it was in another state
      queueEntry.status = 'WAITING';
      queueEntry.queueDate = queueDateNorm;
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
