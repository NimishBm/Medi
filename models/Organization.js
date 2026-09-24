import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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

    // Admin authentication fields
    adminName: {
      type: String,
      trim: true,
    },
    adminEmail: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      unique: true,
    },
    password: {
      type: String,
      minlength: 6,
    },
    adminPhone: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
organizationSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
organizationSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to exclude password from JSON
organizationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model(
  'Organization',
  organizationSchema,
  'Organizations'
);