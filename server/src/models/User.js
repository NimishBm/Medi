import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['PATIENT', 'DOCTOR', 'RECEPTIONIST'],
      required: true,
    },
    // Patient specific fields
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['M', 'F', 'Other'],
    },
    medicalHistory: [
      {
        condition: String,
        diagnosis: String,
        date: Date,
      },
    ],
    allergies: [String],

    // Doctor specific fields
    specialization: String,
    consultationFee: Number,
    roomNumber: String,
    qualifications: [String],
    experience: Number,
    availability: {
      monday: { start: String, end: String },
      tuesday: { start: String, end: String },
      wednesday: { start: String, end: String },
      thursday: { start: String, end: String },
      friday: { start: String, end: String },
      saturday: { start: String, end: String },
      sunday: { start: String, end: String },
    },
    averageConsultationTime: {
      type: Number,
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Family members (only for patients)
    familyMembers: [
      {
        name: {
          type: String,
          required: true,
        },
        relationship: {
          type: String,
          required: true,
        },
        dateOfBirth: Date,
        gender: {
          type: String,
          enum: ['M', 'F', 'Other'],
        },
        allergies: [String],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from response
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
