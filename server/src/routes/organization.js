import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Organization from '../models/Organization.js';
import Doctor from '../models/Doctor.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate a short unique org ID like "ORG-A1B2C3"
const generateOrgId = () => {
  return 'ORG-' + crypto.randomBytes(3).toString('hex').toUpperCase();
};

const generateToken = (org) => {
  return jwt.sign(
    { id: org._id, role: 'ORGANIZATION', email: org.email, orgId: org.orgId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// REGISTER ORGANIZATION
router.post(
  '/register',
  catchAsyncErrors(async (req, res) => {
    const { name, email, phone, password, address } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const existing = await Organization.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Organization already registered with this email' });
    }

    // Ensure unique orgId
    let orgId;
    let attempts = 0;
    do {
      orgId = generateOrgId();
      attempts++;
    } while ((await Organization.findOne({ orgId })) && attempts < 10);

    const org = new Organization({ name, email, phone, password, address, orgId });
    await org.save();

    const token = generateToken(org);

    res.status(201).json({
      message: 'Organization registered successfully',
      orgId: org.orgId,
      token,
      user: { ...org.toJSON(), role: 'ORGANIZATION' }
    });
  })
);

// LOGIN ORGANIZATION
router.post(
  '/login',
  catchAsyncErrors(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const org = await Organization.findOne({ email });
    if (!org) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValid = await org.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(org);

    res.json({
      message: 'Login successful',
      token,
      user: { ...org.toJSON(), role: 'ORGANIZATION' }
    });
  })
);

// GET CURRENT ORG
router.get(
  '/me',
  protect,
  catchAsyncErrors(async (req, res) => {
    if (req.user.role !== 'ORGANIZATION') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const org = await Organization.findById(req.user.id);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json({ ...org.toJSON(), role: 'ORGANIZATION' });
  })
);

export default router;
