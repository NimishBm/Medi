import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
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
    },

    // One entry per person being seen — first entry is always the account holder (self),
    // subsequent entries are family members. Each gets its own appointment document.
    bookedFor: {
      isFamilyMember: {
        type: Boolean,
        default: false,
      },
      name: String,
      relationship: String,
      dateOfBirth: Date,
      gender: {
        type: String,
        enum: ['M', 'F', 'Other'],
      },
      bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      },
      phone: String,
      allergies: [String],
      medicalHistory: [
        {
          condition: String,
          diagnosis: String,
          date: Date,
        },
      ],
    },

    // groupBookingId links all appointments created in the same booking session
    groupBookingId: {
      type: String,
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

appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ tokenNumber: 1, doctorId: 1, appointmentDate: 1 });

export default mongoose.model('Appointment', appointmentSchema);