import mongoose from 'mongoose';

const organizationDoctorSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    }
  },
  { timestamps: true }
);

organizationDoctorSchema.index(
  { organizationId: 1, doctorId: 1 },
  { unique: true }
);

export default mongoose.model(
  'OrganizationDoctor',
  organizationDoctorSchema,
  'OrganizationDoctors'
);