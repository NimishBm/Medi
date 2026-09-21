import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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

organizationIds: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  }
],

    experience: {
      type: Number,
      default: 0
    },

    qualifications: {
      type: [String],
      default: []
    },

    consultationFee: {
      type: Number,
      default: 0
    },

    licenseNumber: {
      type: String
    },

    officeLocation: {
      type: String
    },

    clinicName: {
      type: String
    },

    clinicAddress: {
      type: String
    },

    clinicCity: {
      type: String
    },

    clinicPhone: {
      type: String
    },

    roomNumber: {
      type: String
    },

    clinicLocation: {
      type: String,
      trim: true
    },

    availabilityStart: {
      type: String,
      default: '09:00'
    },

    availabilityEnd: {
      type: String,
      default: '18:00'
    },

    daysOff: {
      type: [String],
      default: []
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
    },

    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);
// Hash password before saving
doctorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

doctorSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
// Hide password from API responses
doctorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// IMPORTANT: use the existing Atlas collection "Doctors"
export default mongoose.model('Doctor', doctorSchema, 'Doctors');