import express from 'express';
import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Receptionist from '../models/Receptionist.js';
import Organization from '../models/Organization.js';
import { protect } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

const generateToken = (user, role) => {
  const payload = {
    id: user._id,
    role,
    email: user.email
  };
  if (role === 'RECEPTIONIST' && user.assignedDoctorId) {
    payload.assignedDoctorId = user.assignedDoctorId;
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// REGISTER PATIENT
router.post(
  '/register',
  catchAsyncErrors(async (req, res) => {
    const {
      name,
      email,
      phone,
      password,
      dateOfBirth,
      gender
    } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: 'Please provide all required fields'
      });
    }

    const existingPatient = await Patient.findOne({ email });

    if (existingPatient) {
      return res.status(400).json({
        message: 'Patient already exists with this email'
      });
    }

    const patient = new Patient({
      name,
      email,
      phone,
      password,
      dateOfBirth,
      gender
    });

    await patient.save();

    const token = generateToken(patient, 'PATIENT');

    res.status(201).json({
      message: 'Patient registered successfully',
      token,
      user: patient.toJSON()
    });
  })
);

// REGISTER DOCTOR
router.post(
  '/register/doctor',
  catchAsyncErrors(async (req, res) => {
    const {
      name,
      email,
      phone,
      password,
      specialization,
      experience,
      qualifications,
      consultationFee,
      roomNumber,
      clinicLocation
    } = req.body;

    if (!name || !email || !phone || !password || !specialization || !experience || !consultationFee) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const existing = await Doctor.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Doctor already exists with this email' });
    }

    const doctor = new Doctor({
      name,
      email,
      phone,
      password,
      specialization,
      experience: Number(experience),
      qualifications: qualifications || [],
      consultationFee: Number(consultationFee),
      roomNumber,
      clinicLocation
    });

    await doctor.save();

    const token = generateToken(doctor, 'DOCTOR');

    res.status(201).json({
      message: 'Doctor registered successfully',
      token,
      user: { ...doctor.toJSON(), role: 'DOCTOR' }
    });
  })
);

// LOGIN
router.post(
  '/login',
  catchAsyncErrors(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password'
      });
    }

    let user = null;
    let role = null;

    // Check PATIENT
    user = await Patient.findOne({ email });
    console.log(`[LOGIN] Patient lookup for "${email}":`, user ? `found (_id: ${user._id})` : 'not found');

    if (user) {
      role = 'PATIENT';
    }

    // Check DOCTOR
    if (!user) {
      user = await Doctor.findOne({ email });
      console.log(`[LOGIN] Doctor lookup for "${email}":`, user ? `found (_id: ${user._id})` : 'not found');

      if (user) {
        role = 'DOCTOR';
      }
    }

    // Check RECEPTIONIST
    if (!user) {
      user = await Receptionist.findOne({ email }).populate('assignedDoctorId', 'name specialization roomNumber');
      console.log(`[LOGIN] Receptionist lookup for "${email}":`, user ? `found (_id: ${user._id})` : 'not found');

      if (user) {
        role = 'RECEPTIONIST';
      }
    }

    if (!user) {
      console.log(`[LOGIN] No user found in any collection for "${email}"`);
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    console.log(`[LOGIN] Password check for "${email}" (role: ${role}):`, isPasswordValid ? 'valid' : 'INVALID');

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user, role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        ...user.toJSON(),
        role
      }
    });
  })
);

// GET CURRENT USER
router.get(
  '/me',
  protect,
  catchAsyncErrors(async (req, res) => {
    let user;

    if (req.user.role === 'PATIENT') {
      user = await Patient.findById(req.user.id);
    } else if (req.user.role === 'DOCTOR') {
      user = await Doctor.findById(req.user.id);
    } else if (req.user.role === 'RECEPTIONIST') {
      user = await Receptionist.findById(req.user.id).populate('assignedDoctorId', 'name specialization roomNumber');
    } else if (req.user.role === 'ORGANIZATION') {
      user = await Organization.findById(req.user.id);
    }

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      ...user.toJSON(),
      role: req.user.role
    });
  })
);

// UPDATE CURRENT USER
router.put(
  '/me',
  protect,
  catchAsyncErrors(async (req, res) => {
    let Model;

    if (req.user.role === 'PATIENT') {
      Model = Patient;
    } else if (req.user.role === 'DOCTOR') {
      Model = Doctor;
    } else if (req.user.role === 'RECEPTIONIST') {
      Model = Receptionist;
    }

    if (!Model) {
      return res.status(400).json({
        message: 'Invalid user role'
      });
    }

    const allowedFields =
      req.user.role === 'PATIENT'
        ? ['familyMembers', 'phone', 'dateOfBirth', 'gender', 'allergies']
        : ['phone'];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const user = await Model.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      ...user.toJSON(),
      role: req.user.role
    });
  })
);

export default router;