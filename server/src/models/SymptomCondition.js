import mongoose from 'mongoose';

const symptomConditionSchema = new mongoose.Schema(
  {
    symptomId: {
      type: String,
      required: true,
      index: true,
    },
    conditionId: {
      type: String,
      required: true,
      index: true,
    },
    likelihoodConditionGivenSymptom: {
      type: String,
    },
    likelihoodSymptomGivenCondition: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  'SymptomCondition',
  symptomConditionSchema
);