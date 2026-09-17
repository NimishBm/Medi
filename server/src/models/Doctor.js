import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true
    },

    password: {
      type: String,
      required: true
    },

    specialization: {
      type: String,
      required: true,
      trim: true
    },

    experience: {
      type: Number,
      required: true
    },

    qualifications: {
      type: [String],
      required: true
    },

    consultationFee: {
      type: Number,
      required: true
    },

    roomNumber: {
      type: String
    },

    clinicLocation: {
      type: String,
      trim: true
    },

    consultationType: {
      type: [String],
      enum: ['In-Clinic', 'Online'],
      default: ['In-Clinic']
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: 0
    },

    averageConsultationTime: {
      type: Number,
      default: 10
    },

    availability: {
      monday: {
        start: String,
        end: String
      },
      tuesday: {
        start: String,
        end: String
      },
      wednesday: {
        start: String,
        end: String
      },
      thursday: {
        start: String,
        end: String
      },
      friday: {
        start: String,
        end: String
      },
      saturday: {
        start: String,
        end: String
      },
      sunday: {
        start: String,
        end: String
      }
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Hide password from API responses
doctorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// IMPORTANT: use the existing Atlas collection "Doctors"
export default mongoose.model('Doctor', doctorSchema, 'Doctors');