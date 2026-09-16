import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'BOOKED',
        'CHECKED_IN',
        'WAITING',
        'CALLED',
        'CONSULTING',
        'COMPLETED',
        'CANCELLED',
        'SKIPPED',
        'NO_SHOW',
      ],
      default: 'BOOKED',
    },
    tokenNumber: {
      type: Number,
      index: true,
    },
    notes: String,
    reason: String,
    priority: {
      type: Boolean,
      default: false,
    },
    priorityReason: String,
    priorityChangedBy: mongoose.Schema.Types.ObjectId,
    priorityChangedAt: Date,
    checkInTime: Date,
    calledTime: Date,
    consultationStartTime: Date,
    consultationEndTime: Date,
    runningLate: {
      isLate: Boolean,
      estimatedDelay: Number,
      markedAt: Date,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    bookedFor: {
      name: String,
      relationship: String,
      isFamilyMember: {
        type: Boolean,
        default: false,
      },
    },
    appointmentType: {
      type: String,
      enum: [
        'General Consultation',
        'New Patient',
        'Follow-up',
        'Specialist Consultation',
        'Routine Check-up',
        'Emergency',
        'Vaccination',
        'Teleconsultation',
      ],
      default: 'General Consultation',
    },
  },
  {
    timestamps: true,
  }
);

// Index for queries
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ tokenNumber: 1, doctorId: 1, appointmentDate: 1 });

export default mongoose.model('Appointment', appointmentSchema);
