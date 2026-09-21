import mongoose from 'mongoose';

const queuePauseSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    pauseDate: {
      type: Date,
      required: true,
    },
    reason: String,
    pausedAt: {
      type: Date,
      default: Date.now,
    },
    resumedAt: Date,
    expectedResumeTime: Date,
    pausedBy: mongoose.Schema.Types.ObjectId,
  },
  {
    timestamps: true,
  }
);

queuePauseSchema.index({ doctorId: 1, pauseDate: 1 });

export default mongoose.model('QueuePause', queuePauseSchema);
