import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Receptionist from '../models/Receptionist.js';
import { protect } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

const generateToken = (user, role) => {
  return jwt.sign(
    {
      id: user._id,
      role,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
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
    const { name, email, phone, password, specialization, licenseNumber, officeLocation, experience, qualifications, consultationFee } = req.body;

    if (!name || !email || !phone || !password || !specialization || !licenseNumber) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ message: 'Doctor already exists with this email' });
    }

    // Call AskMyDoc license verification API (non-blocking — failure just leaves licenseVerified false)
    let licenseVerified = false;
    try {
      const verifyRes = await axios.get(
        `https://api.askmydoc.in/api/verify?reg_number=${licenseNumber}`,
        { timeout: 10000 }
      );
      licenseVerified = verifyRes.data?.verified === true && verifyRes.data?.success === true;
    } catch {
      licenseVerified = false;
    }

    const doctor = new Doctor({
      name,
      email,
      phone,
      password,
      specialization,
      licenseNumber,
      officeLocation,
      experience: experience ? Number(experience) : 0,
      qualifications: qualifications
        ? (Array.isArray(qualifications) ? qualifications : qualifications.split(',').map(q => q.trim()).filter(Boolean))
        : [],
      consultationFee: consultationFee ? Number(consultationFee) : 0,
      licenseVerified,
      verificationStatus: 'PENDING',
    });

    await doctor.save();

    const token = generateToken(doctor, 'DOCTOR');

    res.status(201).json({
      message: 'Registration successful. Your account is under review. You will be able to login once an admin approves your account.',
      token,
      user: { ...doctor.toJSON(), role: 'DOCTOR' },
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

    if (user) {
      role = 'PATIENT';
    }

    // Check DOCTOR
    if (!user) {
      user = await Doctor.findOne({ email });

      if (user) {
        role = 'DOCTOR';

        // Block login if not yet approved by admin
        if (user.verificationStatus === 'PENDING') {
          return res.status(403).json({
            message: 'Your account is under review. Please wait for admin approval before logging in.'
          });
        }
        if (user.verificationStatus === 'REJECTED') {
          return res.status(403).json({
            message: 'Your registration has been rejected. Please contact support for more information.'
          });
        }
      }
    }

    // Check RECEPTIONIST
    if (!user) {
      user = await Receptionist.findOne({ email });

      if (user) {
        role = 'RECEPTIONIST';
      }
    }

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);

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
      user = await Receptionist.findById(req.user.id);
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
        ? ['name', 'phone', 'dateOfBirth', 'gender', 'bloodGroup', 'allergies', 'familyMembers']
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