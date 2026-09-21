import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const patientSchema = new mongoose.Schema(
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
      required: true,
      minlength: 6
    },

    dateOfBirth: Date,

    gender: {
      type: String,
      enum: ['M', 'F', 'Other']
    },

    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },

    medicalHistory: [
      {
        condition: String,
        diagnosis: String,
        date: Date
      }
    ],

    allergies: [String],

    familyMembers: [
      {
        name: {
          type: String,
          required: true
        },
        relationship: {
          type: String,
          required: true
        },
        dateOfBirth: Date,
        gender: {
          type: String,
          enum: ['M', 'F', 'Other']
        },
        allergies: [String]
      }
    ]
  },
  {
    timestamps: true
  }
);

patientSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

patientSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

patientSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('Patient', patientSchema, 'Patients');