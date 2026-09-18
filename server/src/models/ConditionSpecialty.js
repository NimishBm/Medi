import mongoose from 'mongoose';

const conditionSpecialtySchema = new mongoose.Schema(
  {
    conditionId: {
      type: String,
      required: true,
      index: true,
    },
    specialtyId: {
      type: Number,
      required: true,
      index: true,
    },
    weight: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  'ConditionSpecialty',
  conditionSpecialtySchema
);