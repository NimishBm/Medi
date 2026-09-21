import mongoose from 'mongoose';

const symptomSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      required: true,
      unique: true,
    },
    snomedId: {
      type: String,
    },
    rootSnomedId: {
      type: String,
    },
    rootSnomedName: {
      type: String,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    triageLevel: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Symptom', symptomSchema);