import mongoose from 'mongoose';

const specialtySchema = new mongoose.Schema(
  {
    specialtyId: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Specialty', specialtySchema);