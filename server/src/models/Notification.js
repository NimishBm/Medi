import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    recipientModel: {
      type: String,
      enum: ['Doctor', 'Patient', 'Receptionist'],
      default: 'Patient',
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
      default: 'APPOINTMENT_CANCELLED',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
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

export default mongoose.model('Notification', notificationSchema, 'Notifications');
