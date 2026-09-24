import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Organization from '../models/Organization.js';
import Doctor from '../models/Doctor.js';
import OrganizationDoctor from '../models/OrganizationDoctor.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// ── helpers ──────────────────────────────────────────────────────────────────

const generateToken = (org) =>
  jwt.sign(
    { id: org._id, email: org.adminEmail },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      return res.status(403).json({ message: 'Authorization required' });
    }
    req.org = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// ── POST /api/org-auth/register ──────────────────────────────────────────────

router.post(
  '/register',
  catchAsyncErrors(async (req, res) => {
    const { name, organizationName, type, adminName, adminEmail, password, adminPhone, city, address } = req.body;

    if (!name || !adminName || !adminEmail || !password) {
      return res.status(400).json({ message: 'Organization name, admin name, admin email and password are required' });
    }

    const existing = await Organization.findOne({ adminEmail });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const org = await Organization.create({
      name,
      type: type || 'HOSPITAL',
      description: organizationName || '',
      adminName,
      adminEmail,
      password,
      adminPhone: adminPhone || '',
      city: city || '',
      address: address || '',
      isActive: true,
      verificationStatus: 'APPROVED',
    });

    const token = generateToken(org);
    res.status(201).json({
      message: 'Registration successful',
      token,
      organization: org.toJSON(),
    });
  })
);

// ── POST /api/org-auth/login ─────────────────────────────────────────────────

router.post(
  '/login',
  catchAsyncErrors(async (req, res) => {
    const { adminEmail, password } = req.body;

    if (!adminEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const org = await Organization.findOne({ adminEmail });
    if (!org || !org.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!org.isActive) {
      return res.status(401).json({ message: 'Organization is not active' });
    }

    const validPassword = await org.comparePassword(password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(org);
    res.json({
      message: 'Login successful',
      token,
      organization: org.toJSON(),
    });
  })
);

// ── GET /api/org-auth/me ─────────────────────────────────────────────────────

router.get(
  '/me',
  requireAuth,
  catchAsyncErrors(async (req, res) => {
    const org = await Organization.findById(req.org.id);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    res.json({ organization: org.toJSON() });
  })
);

// ── PUT /api/org-auth/profile ────────────────────────────────────────────────

router.put(
  '/profile',
  requireAuth,
  catchAsyncErrors(async (req, res) => {
    const { adminName, adminPhone, description, address, city, website, phone, logo } = req.body;
    const org = await Organization.findById(req.org.id);

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    if (adminName) org.adminName = adminName;
    if (adminPhone) org.adminPhone = adminPhone;
    if (description) org.description = description;
    if (address) org.address = address;
    if (city) org.city = city;
    if (website) org.website = website;
    if (phone) org.phone = phone;
    if (logo) org.logo = logo;

    await org.save();
    res.json({ message: 'Profile updated', organization: org.toJSON() });
  })
);

// ── PUT /api/org-auth/password ───────────────────────────────────────────────

router.put(
  '/password',
  requireAuth,
  catchAsyncErrors(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const org = await Organization.findById(req.org.id);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const validPassword = await org.comparePassword(currentPassword);
    if (!validPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    org.password = newPassword;
    await org.save();

    res.json({ message: 'Password updated successfully' });
  })
);

// ── GET /api/org-auth/doctors ────────────────────────────────────────────

router.get(
  '/doctors',
  requireAuth,
  catchAsyncErrors(async (req, res) => {
    const org = await Organization.findById(req.org.id);

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const orgDoctors = await OrganizationDoctor.find({ organizationId: req.org.id })
      .populate('doctorId')
      .sort({ createdAt: -1 });

    const doctors = orgDoctors
      .map(od => {
        const doc = od.doctorId;
        if (!doc) return null;
        const docObj = doc.toObject ? doc.toObject() : JSON.parse(JSON.stringify(doc));
        delete docObj.password;
        return docObj;
      })
      .filter(Boolean);

    res.json({
      organization: org.name,
      totalDoctors: doctors.length,
      doctors,
    });
  })
);

// ── GET /api/org-auth/stats ─────────────────────────────────────────────

router.get(
  '/stats',
  requireAuth,
  catchAsyncErrors(async (req, res) => {
    const orgId = mongoose.Types.ObjectId.isValid(req.org.id)
      ? new mongoose.Types.ObjectId(req.org.id)
      : req.org.id;

    const totalDoctors = await Doctor.countDocuments({ organizationId: orgId });
    const activeDoctors = await Doctor.countDocuments({
      organizationId: orgId,
      isActive: true
    });
    const verifiedDoctors = await Doctor.countDocuments({
      organizationId: orgId,
      isVerified: true
    });

    res.json({
      totalDoctors,
      activeDoctors,
      verifiedDoctors,
      inactiveDoctors: totalDoctors - activeDoctors,
    });
  })
);

// ── GET /api/org-auth/doctor/:doctorId ──────────────────────────────────

router.get(
  '/doctor/:doctorId',
  requireAuth,
  catchAsyncErrors(async (req, res) => {
    const doctor = await Doctor.findById(req.params.doctorId).select('-password');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const link = await OrganizationDoctor.findOne({
      organizationId: req.org.id,
      doctorId: req.params.doctorId
    });

    if (!link) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json({ doctor });
  })
);

export default router;
