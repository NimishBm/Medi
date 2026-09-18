import mongoose from 'mongoose';

const conditionSchema = new mongoose.Schema(
  {
    snomedId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
    },
    triageLevel: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Condition', conditionSchema);