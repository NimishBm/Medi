import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema(
  {
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
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    symptoms: [String],
    diagnosis: String,
    notes: String,
    treatmentPlan: String,
    followUpDate: Date,
    followUpNotes: String,
    consultationDuration: Number,
  },
  {
    timestamps: true,
  }
);

consultationSchema.index({ patientId: 1, createdAt: -1 });
consultationSchema.index({ doctorId: 1, createdAt: -1 });

export default mongoose.model('Consultation', consultationSchema);
