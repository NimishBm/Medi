import express from 'express';
import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Queue from '../models/Queue.js';
import Notification from '../models/Notification.js';
import Payment from '../models/Payment.js';
import Doctor from '../models/Doctor.js';
import { io } from '../server.js';

import { protect, authorize } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// Helper to reassign/maintain sequential token numbers ordered by appointment booked timings
const reassignTokensForDoctorDate = async (doctorId, appointmentDate) => {
  const startOfDay = new Date(appointmentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(appointmentDate);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    doctorId,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'CANCELLED' },
  }).sort({ appointmentTime: 1, createdAt: 1 });

  for (let i = 0; i < appointments.length; i++) {
    const expectedToken = i + 1;
    if (appointments[i].tokenNumber !== expectedToken) {
      appointments[i].tokenNumber = expectedToken;
      await appointments[i].save();
      await Queue.updateMany(
        { appointmentId: appointments[i]._id },
        { $set: { tokenNumber: expectedToken } }
      );
    }
  }
};

// Helper to generate token number based on chronological appointment booked timing
const generateTokenNumber = async (doctorId, appointmentDate, appointmentTime = '00:00') => {
  const startOfDay = new Date(appointmentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(appointmentDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Count existing active appointments before this appointment time on this date
  const countBefore = await Appointment.countDocuments({
    doctorId,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'CANCELLED' },
    appointmentTime: { $lte: appointmentTime },
  });

  return countBefore + 1;
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
    const attendeeList = attendees && attendees.length > 0
      ? attendees
      : [bookedFor || { isFamilyMember: false }];

    // Generate a shared groupBookingId only when booking for multiple people
    const groupBookingId = attendeeList.length > 1
      ? new mongoose.Types.ObjectId().toString()
      : undefined;

    const createdAppointments = [];

    // Normalise queueDate to UTC midnight for consistent date matching
    const queueDateNorm = new Date(appointmentDate);
    queueDateNorm.setUTCHours(0, 0, 0, 0);

    const apptDateStr = new Date(appointmentDate).toISOString().split('T')[0];
    const todayStr    = new Date().toISOString().split('T')[0];
    const isToday     = apptDateStr === todayStr;

    for (const attendee of attendeeList) {
      // Each person gets their own token
      const tokenNumber = await generateTokenNumber(doctorId, new Date(appointmentDate), appointmentTime);

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

      // Auto-add patient to doctor's patientsSeen list
      try {
        await Doctor.findByIdAndUpdate(
          doctorId,
          { $addToSet: { patientsSeen: patientId } },
          { new: true }
        );
        console.log('[Doctor] patient added to patientsSeen for doctor', doctorId);
      } catch (dErr) {
        console.error('[Doctor] failed to update patientsSeen:', dErr.message);
      }

      // Auto-create queue entry for today's appointments so doctor sees them in Live Queue immediately
      if (isToday) {
        try {
          await Queue.create({
            doctorId,
            appointmentId: appointment._id,
            patientId,
            tokenNumber,
            queueDate: queueDateNorm,
            status: 'WAITING',
          });
          console.log('[Queue] entry created for appointment', appointment._id);
        } catch (qErr) {
          console.error('[Queue] failed to create entry:', qErr.message);
        }
      }

      // Notify doctor via their notification room
      const apptDateFmt = new Date(appointmentDate).toLocaleDateString('en-IN', {
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
        message: `${attendeeDisplayName} booked a ${appointment.appointmentType} on ${apptDateFmt} at ${appointmentTime}. Token #${tokenNumber}.`,
        data: { patientName: attendeeDisplayName, appointmentTime, appointmentDate, tokenNumber },
      });

      // Real-time notification to doctor's personal room
      io.to(`doctor-${doctorId}`).emit('new-appointment', {
        appointmentId: appointment._id,
        patientName:   appointment.patientId?.name || 'A patient',
        date:          appointmentDate,
        time:          appointmentTime,
        tokenNumber,
        bookedFor:     attendee,
      });
    }

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

    const isReschedule = req.user.role === 'DOCTOR' &&
      (req.body.appointmentDate || req.body.appointmentTime) &&
      (String(appointment.doctorId) === req.user.id);

    const oldDate = appointment.appointmentDate;
    const oldTime = appointment.appointmentTime;

    Object.assign(appointment, req.body);
    await appointment.save();
    await appointment.populate(['patientId', 'doctorId']);

    if (isReschedule) {
      const newDate = req.body.appointmentDate || oldDate;
      const newTime = req.body.appointmentTime || oldTime;
      const dateStr = new Date(newDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      const doctorName = appointment.doctorId?.name ? `Dr. ${appointment.doctorId.name.replace(/^Dr\.?\s+/i, '')}` : 'Your doctor';
      await Notification.create({
        recipientId:    appointment.patientId._id,
        recipientModel: 'Patient',
        type:           'APPOINTMENT_RESCHEDULED',
        title:          'Appointment Rescheduled',
        message:        `${doctorName} has rescheduled your ${appointment.appointmentType || 'appointment'} to ${dateStr} at ${newTime}.`,
        appointmentId:  appointment._id,
      });
      io.to(`notifications-${appointment.patientId._id}`).emit('new-notification', { recipientId: String(appointment.patientId._id) });
    }

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
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    appointment.status = 'CANCELLED';
    await appointment.save();

    // Remove any queue entry for this appointment
    await Queue.deleteMany({ appointmentId: appointment._id });
    io.emit('queue-update', { doctorId: appointment.doctorId });
    io.to(`queue-${appointment.doctorId}`).emit('queue-update', { doctorId: appointment.doctorId });

    // Automatic Refund: If doctor cancels (or refund requested), refund any PAID payment associated with this appointment
    let refundInfo = null;
    if (req.user.role === 'DOCTOR') {
      const payment = await Payment.findOne({
        appointmentId: appointment._id,
        status: 'PAID',
      });
      if (payment) {
        payment.status = 'REFUNDED';
        payment.refundDate = new Date();
        payment.refundReason = req.body?.reason || 'Appointment cancelled by doctor';
        await payment.save();
        refundInfo = payment;
      }
    }

    // Reassign tokens for the rest of the day to maintain clean sequence without gaps
    try {
      await reassignTokensForDoctorDate(appointment.doctorId, appointment.appointmentDate);
    } catch (tokErr) {
      console.error('[Appointments] Error reordering tokens after cancellation:', tokErr.message);
    }

    // Notify patient when a doctor cancels
    if (req.user.role === 'DOCTOR') {
      const dateStr = new Date(appointment.appointmentDate).toDateString();
      const refundMsg = refundInfo ? ' Any payment made has been automatically refunded to your account.' : '';
      const notification = await Notification.create({
        userId:        appointment.patientId,
        type:          'APPOINTMENT_CANCELLED',
        title:         'Appointment Cancelled',
        message:       `Your appointment on ${dateStr} at ${appointment.appointmentTime} has been cancelled by your doctor.`,
        appointmentId: appointment._id,
      });
      io.to(`notifications-${appointment.patientId}`).emit('new-notification', { recipientId: String(appointment.patientId) });
    }

    res.json({
      message: 'Appointment cancelled successfully' + (refundInfo ? ' and payment refunded' : ''),
      appointment,
      refund: refundInfo,
    });
  })
);

// Reschedule appointment (doctor only)
router.put(
  '/:id/reschedule',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const { appointmentDate, appointmentTime } = req.body;
    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: 'New date and time are required' });
    }
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (String(appointment.doctorId) !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const oldDate = appointment.appointmentDate;
    const rescheduledToStr = new Date(appointmentDate).toISOString().split('T')[0];
    const todayCheckStr    = new Date().toISOString().split('T')[0];

    // Remove existing WAITING queue entry (will be re-created if rescheduled to today)
    await Queue.deleteOne({ appointmentId: appointment._id, status: 'WAITING' });

    appointment.appointmentDate = appointmentDate;
    appointment.appointmentTime = appointmentTime;
    await appointment.save();

    // Reorder tokens for old date and new date
    try {
      await reassignTokensForDoctorDate(appointment.doctorId, oldDate);
      await reassignTokensForDoctorDate(appointment.doctorId, appointmentDate);
      const refreshed = await Appointment.findById(appointment._id);
      if (refreshed) appointment.tokenNumber = refreshed.tokenNumber;
    } catch (rErr) {
      console.error('[Appointments] Error reordering tokens on reschedule:', rErr.message);
    }

    // If rescheduled to today, create a fresh queue entry
    if (rescheduledToStr === todayCheckStr) {
      const queueDateNorm = new Date(appointmentDate);
      queueDateNorm.setUTCHours(0, 0, 0, 0);
      await Queue.create({
        doctorId:      appointment.doctorId,
        appointmentId: appointment._id,
        patientId:     appointment.patientId,
        tokenNumber:   appointment.tokenNumber,
        queueDate:     queueDateNorm,
        status:        'WAITING',
      });
    }

    io.emit('queue-update', { doctorId: appointment.doctorId });
    io.to(`queue-${appointment.doctorId}`).emit('queue-update', { doctorId: appointment.doctorId });

    const dateStr = new Date(appointmentDate).toDateString();
    const notification = await Notification.create({
      userId:        appointment.patientId,
      type:          'APPOINTMENT_RESCHEDULED',
      title:         'Appointment Rescheduled',
      message:       `Your appointment has been rescheduled to ${dateStr} at ${appointmentTime}.`,
      appointmentId: appointment._id,
    });
    io.to(`notifications-${appointment.patientId}`).emit('new-notification', { recipientId: String(appointment.patientId) });

    res.json({ message: 'Appointment rescheduled successfully', appointment });
  })
);

// Check in patient — adds to live queue (WAITING)
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

    const { tokenNumber, appointmentDate, doctorId, patientId } = appointment;

    const queueDateNorm = new Date(appointmentDate);
    queueDateNorm.setUTCHours(0, 0, 0, 0);

    // Upsert queue entry
    let queueEntry = await Queue.findOne({ appointmentId: appointment._id });

    if (!queueEntry) {
      queueEntry = new Queue({
        doctorId,
        appointmentId: appointment._id,
        patientId,
        tokenNumber,
        queueDate: queueDateNorm,
        status: 'WAITING',
      });
      await queueEntry.save();
    } else {
      queueEntry.status   = 'WAITING';
      queueEntry.queueDate = queueDateNorm;
      await queueEntry.save();
    }

    io.emit('queue-update', { doctorId });
    io.to(`queue-${doctorId}`).emit('queue-update', { doctorId });

    res.json({
      message: 'Patient checked in successfully',
      appointment,
      queueEntry,
    });
  })
);

export default router;
