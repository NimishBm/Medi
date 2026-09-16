import express from 'express';
import Appointment from '../models/Appointment.js';
import Queue from '../models/Queue.js';
import Payment from '../models/Payment.js';
import { protect, authorize } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// Get analytics for today
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

    const appointments = await Appointment.find(filter);

    const stats = {
      totalPatients: appointments.length,
      completed: appointments.filter((a) => a.status === 'COMPLETED').length,
      waiting: appointments.filter((a) => a.status === 'WAITING').length,
      cancelled: appointments.filter((a) => a.status === 'CANCELLED').length,
      noShow: appointments.filter((a) => a.status === 'NO_SHOW').length,
    };

    res.json(stats);
  })
);

// Get doctor analytics
router.get(
  '/doctor/:doctorId',
  protect,
  authorize('DOCTOR', 'RECEPTIONIST'),
  catchAsyncErrors(async (req, res) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const appointments = await Appointment.find({
      doctorId: req.params.doctorId,
      appointmentDate: { $gte: thirtyDaysAgo },
    });

    const queues = await Queue.find({
      doctorId: req.params.doctorId,
      queueDate: { $gte: thirtyDaysAgo },
      status: 'COMPLETED',
    });

    const completedDurations = queues.filter((q) => q.consultationDuration).map((q) => q.consultationDuration);
    const avgConsultationTime = completedDurations.length > 0 ? Math.round(completedDurations.reduce((a, b) => a + b) / completedDurations.length) : 0;

    const payments = await Payment.find({
      doctorId: req.params.doctorId,
      createdAt: { $gte: thirtyDaysAgo },
      status: 'PAID',
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.totalAmount, 0);

    res.json({
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter((a) => a.status === 'COMPLETED').length,
      cancelledAppointments: appointments.filter((a) => a.status === 'CANCELLED').length,
      noShowAppointments: appointments.filter((a) => a.status === 'NO_SHOW').length,
      averageConsultationTime: avgConsultationTime,
      totalRevenue,
      patientsServed: appointments.filter((a) => a.status === 'COMPLETED').length,
    });
  })
);

// Get clinic analytics
router.get(
  '/clinic/overview',
  protect,
  authorize('RECEPTIONIST'),
  catchAsyncErrors(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.find({
      appointmentDate: { $gte: today, $lt: tomorrow },
    });

    const payments = await Payment.find({
      createdAt: { $gte: today, $lt: tomorrow },
      status: 'PAID',
    });

    res.json({
      totalAppointmentsToday: todayAppointments.length,
      completedToday: todayAppointments.filter((a) => a.status === 'COMPLETED').length,
      waitingToday: todayAppointments.filter((a) => a.status === 'WAITING').length,
      cancelledToday: todayAppointments.filter((a) => a.status === 'CANCELLED').length,
      revenueToday: payments.reduce((sum, p) => sum + p.totalAmount, 0),
    });
  })
);

export default router;
