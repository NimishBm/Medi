import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },

    consultationFee: {
      type: Number,
      required: true,
    },

    additionalCharges: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD'],
      required: true,
    },

    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'REFUNDED'],
      default: 'PENDING',
    },

    paymentDate: Date,
    refundDate: Date,
    refundReason: String,

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },

    notes: String,
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ patientId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

export default mongoose.model('Payment', paymentSchema);