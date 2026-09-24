import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    organizationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ['HOSPITAL', 'CLINIC', 'CHAIN', 'DIAGNOSTIC_CENTER'],
      default: 'HOSPITAL',
    },

    description: { type: String, trim: true },
    logo:        { type: String },
    address:     { type: String },
    city:        { type: String },
    phone:       { type: String },
    email:       { type: String },
    website:     { type: String },

    specialties: { type: [String], default: [] },

    isActive:           { type: Boolean, default: true },
    verificationStatus: { type: String, enum: ['PENDING', 'APPROVED'], default: 'APPROVED' },
  },
  { timestamps: true }
);

export default mongoose.model(
  'Organization',
  organizationSchema,
  'Organizations'
);