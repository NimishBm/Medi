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

    // Organization membership
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
    },

    // Tracks a pending join request to an org (before approval)
    pendingOrgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
    },

    // NONE = independent, PENDING = requested join, APPROVED = member
    orgMembershipStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'APPROVED'],
      default: 'NONE'
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
  // Support both bcrypt-hashed and plain text passwords already in the DB
  const isHashed = this.password.startsWith('$2');
  if (isHashed) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
  return enteredPassword === this.password;
};

// Hide password from API responses
doctorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// IMPORTANT: use the existing Atlas collection "Doctors"
export default mongoose.model('Doctor', doctorSchema, 'Doctors');