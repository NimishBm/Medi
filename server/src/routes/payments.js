import express from 'express';
import Payment from '../models/Payment.js';
import Doctor from '../models/Doctor.js';
import { protect, authorize } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// Create payment
router.post(
  '/',
  protect,
  authorize('RECEPTIONIST'),
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
  authorize('RECEPTIONIST'),
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

export default router;