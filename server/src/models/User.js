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
      enum: ['M', 'F', 'Other', null],
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
    videoConsultationFee: Number,
    roomNumber: String,
    qualifications: [String],
    boardCertifications: [String],
    specializations: [String],
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
    consultationDuration: {
      type: Number,
      default: 30,
    },
    waitingTime: {
      type: Number,
      default: 30,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    onlineConsultation: {
      type: Boolean,
      default: true,
    },
    emergencyConsultation: {
      type: Boolean,
      default: false,
    },
    aboutMe: String,
    treatments: [String],
    languages: [String],
    achievements: [String],
    registrationNumber: String,
    hospital: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    insurance: String,
    website: String,
    patientsSeen: {
      type: Number,
      default: 0,
    },
    successRate: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    breaks: [
      {
        id: Number,
        day: String,
        start: String,
        end: String,
        title: String,
      },
    ],
    bufferTime: {
      type: Number,
      default: 0,
    },
    maxPatientsPerDay: {
      type: Number,
      default: null,
    },
    allowSameDayBooking: {
      type: Boolean,
      default: true,
    },
    minBookingNotice: {
      type: Number,
      default: 0,
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
          enum: ['M', 'F', 'Other', null],
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
