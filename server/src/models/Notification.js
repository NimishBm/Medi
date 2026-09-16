import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    type: {
      type: String,
      enum: [
        'APPOINTMENT_CONFIRMED',
        'APPOINTMENT_CANCELLED',
        'CHECKED_IN',
        'QUEUE_UPDATE',
        'CALLED',
        'ALMOST_TURN',
        'YOUR_TURN',
        'APPOINTMENT_COMPLETED',
        'PRESCRIPTION_READY',
      ],
      required: true,
    },
    title: String,
    message: String,
    data: mongoose.Schema.Types.Mixed,
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
