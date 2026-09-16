import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register
router.post(
  '/register',
  catchAsyncErrors(async (req, res) => {
    const { name, email, phone, password, role, dateOfBirth, gender } = req.body;

    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Only allow PATIENT registration through API. DOCTOR and RECEPTIONIST require admin setup.
    if (role !== 'PATIENT') {
      return res.status(400).json({ message: 'Only patient registration is allowed through this endpoint' });
    }

    const user = new User({
      name,
      email,
      phone,
      password,
      role,
      dateOfBirth,
      gender,
    });

    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON(),
    });
  })
);

// Login
router.post(
  '/login',
  catchAsyncErrors(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  })
);

// Get current user
router.get(
  '/me',
  protect,
  catchAsyncErrors(async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json(user.toJSON());
  })
);

// Update current user
router.put(
  '/me',
  protect,
  catchAsyncErrors(async (req, res) => {
    const { familyMembers, phone, dateOfBirth, gender, allergies } = req.body;
    const updateData = {};
    if (familyMembers !== undefined) updateData.familyMembers = familyMembers;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (allergies !== undefined) updateData.allergies = allergies;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });
    res.json(user.toJSON());
  })
);

export default router;
