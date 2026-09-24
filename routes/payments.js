import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Payment from '../models/Payment.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Notification from '../models/Notification.js';
import { io } from '../server.js';
import { protect, authorize } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

let _razorpay = null;
const getRazorpay = () => {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID?.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET?.trim(),
    });
  }
  return _razorpay;
};

const router = express.Router();

// Create payment
router.post(
  '/',
  protect,
  authorize('DOCTOR', 'PATIENT'),
  catchAsyncErrors(async (req, res) => {
    const {
      appointmentId,
      patientId,
      doctorId,
      paymentMethod,
      additionalCharges,
    } = req.body;

    if (!appointmentId || !patientId || !doctorId || !paymentMethod) {
      return res.status(400).json({
        message: 'Please provide all required fields',
      });
    }

    const doctor = await Doctor.findById(doctorId);

    const consultationFee = doctor.consultationFee || 0;

    const totalAmount =
      consultationFee + (additionalCharges || 0);

    const payment = new Payment({
      appointmentId,
      patientId,
      doctorId,
      consultationFee,
      additionalCharges: additionalCharges || 0,
      totalAmount,
      paymentMethod,
      status: 'PAID',
      paymentDate: new Date(),
      processedBy: req.user.id,
    });

    await payment.save();

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment,
    });
  })
);

// Get payments for patient
router.get(
  '/patient/:patientId',
  protect,
  catchAsyncErrors(async (req, res) => {
    const payments = await Payment.find({
      patientId: req.params.patientId,
    })
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });

    res.json(payments);
  })
);

// Get payments for doctor
router.get(
  '/doctor/:doctorId',
  protect,
  authorize('DOCTOR', 'ADMIN'),
  catchAsyncErrors(async (req, res) => {
    const payments = await Payment.find({
      doctorId: req.params.doctorId,
    })
      .populate('patientId', 'name email phone age gender bloodGroup')
      .populate('appointmentId', 'appointmentDate appointmentTime appointmentType tokenNumber')
      .sort({ createdAt: -1 });

    res.json(payments);
  })
);

// Get payment by ID
router.get(
  '/:id',
  protect,
  catchAsyncErrors(async (req, res) => {
    const payment = await Payment.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization');

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found',
      });
    }

    res.json(payment);
  })
);

// Refund payment
router.post(
  '/:id/refund',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const { refundReason } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found',
      });
    }

    payment.status = 'REFUNDED';
    payment.refundDate = new Date();
    payment.refundReason =
      refundReason || 'No reason provided';

    await payment.save();

    res.json({
      message: 'Payment refunded successfully',
      payment,
    });
  })
);

// POST /api/payments/razorpay/order — create a Razorpay order before showing checkout
router.post(
  '/razorpay/order',
  protect,
  authorize('PATIENT'),
  catchAsyncErrors(async (req, res) => {
    const { amount } = req.body; // amount in INR (not paise)
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const order = await getRazorpay().orders.create({
      amount:   Math.round(amount * 100), // convert to paise
      currency: 'INR',
      receipt:  `rcpt_${Date.now()}`,
    });

    res.json(order);
  })
);

// POST /api/payments/razorpay/verify — verify signature, create appointment + payment record
router.post(
  '/razorpay/verify',
  protect,
  authorize('PATIENT'),
  catchAsyncErrors(async (req, res) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      appointmentPayload,
      totalAmount,
    } = req.body;

    // Verify HMAC-SHA256 signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed — invalid signature' });
    }

    // Create appointment(s) — reuse the same logic as POST /api/appointments
    const {
      patientId, doctorId, appointmentDate, appointmentTime,
      appointmentType, reason, bookedBy, attendees,
    } = appointmentPayload;

    const attendeeList = attendees?.length > 0 ? attendees : [{ isFamilyMember: false }];
    const createdAppointments = [];

    for (const attendee of attendeeList) {
      const startOfDay = new Date(appointmentDate); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay   = new Date(appointmentDate); endOfDay.setHours(23, 59, 59, 999);
      const last = await Appointment.findOne({ doctorId, appointmentDate: { $gte: startOfDay, $lte: endOfDay } }).sort({ tokenNumber: -1 });
      const tokenNumber = (last?.tokenNumber || 0) + 1;

      const appt = await Appointment.create({
        patientId,
        doctorId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        appointmentType: appointmentType || 'General Consultation',
        reason:          reason || 'Consultation',
        bookedBy,
        tokenNumber,
        status: 'BOOKED',
        bookedFor: attendee,
      });
      createdAppointments.push(appt);
    }

    // Save a Payment record
    const doctor = await Doctor.findById(doctorId);
    await Payment.create({
      appointmentId:     createdAppointments[0]._id,
      patientId,
      doctorId,
      consultationFee:   doctor?.consultationFee || 0,
      totalAmount:       totalAmount || 0,
      paymentMethod:     'RAZORPAY',
      status:            'PAID',
      razorpayOrderId:   razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paymentDate:       new Date(),
      processedBy:       patientId,
    });

    // Notify doctor for each appointment created via Razorpay
    const apptDateFormatted = new Date(appointmentDate).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
    for (const appt of createdAppointments) {
      await Notification.create({
        recipientId:    doctorId,
        recipientModel: 'Doctor',
        appointmentId:  appt._id,
        type:           'NEW_APPOINTMENT',
        title:          'New Appointment Booked',
        message:        `A patient booked a ${appt.appointmentType || 'consultation'} on ${apptDateFormatted} at ${appointmentTime}. Token #${appt.tokenNumber}.`,
        data: { appointmentTime, appointmentDate, tokenNumber: appt.tokenNumber },
      });
    }
    io.to(`notifications-${doctorId}`).emit('new-notification', { recipientId: String(doctorId) });

    res.json(createdAppointments.length === 1 ? createdAppointments[0] : createdAppointments);
  })
);

export default router;