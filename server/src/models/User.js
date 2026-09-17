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

    // ==================================================
    // PATIENT SPECIFIC FIELDS
    // ==================================================

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


    // ==================================================
    // DOCTOR SPECIFIC FIELDS
    // ==================================================

    specialization: {
      type: String,
      trim: true,
    },

    experience: {
      type: Number,
    },

    qualifications: {
      type: [String],
    },

    consultationFee: {
      type: Number,
    },

    roomNumber: {
      type: String,
    },

    // Clinic location
    clinicLocation: {
      type: String,
      trim: true,
    },

    // Consultation types
    // Example: ["In-Clinic", "Online"]
    consultationType: {
      type: [String],
      enum: ['In-Clinic', 'Online'],
      default: ['In-Clinic'],
    },

    // Doctor availability
    availability: {
      monday: {
        start: String,
        end: String,
      },

      tuesday: {
        start: String,
        end: String,
      },

      wednesday: {
        start: String,
        end: String,
      },

      thursday: {
        start: String,
        end: String,
      },

      friday: {
        start: String,
        end: String,
      },

      saturday: {
        start: String,
        end: String,
      },

      sunday: {
        start: String,
        end: String,
      },
    },

    // Average consultation duration in minutes
    averageConsultationTime: {
      type: Number,
      default: 10,
    },

    // Patient review information
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Doctor active status
    isActive: {
      type: Boolean,
      default: true,
    },


    // ==================================================
    // FAMILY MEMBERS
    // ==================================================

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


// ======================================================
// HASH PASSWORD BEFORE SAVING
// ======================================================

userSchema.pre('save', async function (next) {

  if (!this.isModified('password')) {
    return next();
  }

  try {

    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(
      this.password,
      salt
    );

    next();

  } catch (error) {

    next(error);

  }
});


// ======================================================
// COMPARE PASSWORD
// ======================================================

userSchema.methods.comparePassword = async function (
  enteredPassword
) {

  return await bcrypt.compare(
    enteredPassword,
    this.password
  );

};


// ======================================================
// REMOVE PASSWORD FROM RESPONSE
// ======================================================

userSchema.methods.toJSON = function () {

  const obj = this.toObject();

  delete obj.password;

  return obj;

};


export default mongoose.model(
  'User',
  userSchema
);