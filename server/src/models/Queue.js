import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    queueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['WAITING', 'CALLED', 'CONSULTING', 'COMPLETED', 'SKIPPED', 'NO_SHOW'],
      default: 'WAITING',
    },
    position: Number,
    calledAt: Date,
    consultationStartAt: Date,
    consultationEndAt: Date,
    consultationDuration: Number,
    skippedAt: Date,
    noShowAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queue queries
queueSchema.index({ doctorId: 1, queueDate: 1, status: 1 });
queueSchema.index({ patientId: 1, queueDate: 1 });
queueSchema.index({ doctorId: 1, queueDate: 1, tokenNumber: 1 });

export default mongoose.model('Queue', queueSchema);
