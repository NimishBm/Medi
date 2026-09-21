import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // recipient — can be a Doctor, Patient or Receptionist ObjectId
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    recipientModel: {
      type: String,
      enum: ['Doctor', 'Patient', 'Receptionist'],
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    type: {
      type: String,
      enum: [
        'NEW_APPOINTMENT',
        'APPOINTMENT_CANCELLED',
        'APPOINTMENT_RESCHEDULED',
        'CHECKED_IN',
        'QUEUE_UPDATE',
        'CALLED',
        'APPOINTMENT_COMPLETED',
        'PRESCRIPTION_READY',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: mongoose.Schema.Types.Mixed,
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
