import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import Admin from '../models/Admin.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// ── helpers ──────────────────────────────────────────────────────────────────

const generateAdminToken = (admin) =>
  jwt.sign(
    { id: admin._id, role: 'ADMIN', email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access only' });
    }
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// ── POST /api/admin/login ─────────────────────────────────────────────────────

router.post(
  '/login',
  catchAsyncErrors(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await admin.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateAdminToken(admin);
    res.json({ message: 'Login successful', token, user: { ...admin.toJSON(), role: 'ADMIN' } });
  })
);

// ── GET /api/admin/doctors ────────────────────────────────────────────────────
// Returns all doctors with optional ?status=PENDING|APPROVED|REJECTED filter

router.get(
  '/doctors',
  requireAdmin,
  catchAsyncErrors(async (req, res) => {
    let filter = {};
    if (req.query.status) {
      const status = req.query.status.toUpperCase();
      if (status === 'PENDING') {
        // include docs where field is 'PENDING', null, or missing (pre-migration records)
        filter = { $or: [{ verificationStatus: 'PENDING' }, { verificationStatus: { $exists: false } }, { verificationStatus: null }] };
      } else {
        filter = { verificationStatus: status };
      }
    }

    const doctors = await Doctor.find(filter).sort({ createdAt: -1 });
    res.json(doctors);
  })
);

// ── GET /api/admin/doctors/:id ────────────────────────────────────────────────

router.get(
  '/doctors/:id',
  requireAdmin,
  catchAsyncErrors(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  })
);

// ── POST /api/admin/doctors/:id/approve ──────────────────────────────────────

router.post(
  '/doctors/:id/approve',
  requireAdmin,
  catchAsyncErrors(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    doctor.verificationStatus = 'APPROVED';
    doctor.verificationNote = req.body.note || '';
    await doctor.save();

    res.json({ message: 'Doctor approved', doctor: doctor.toJSON() });
  })
);

// ── POST /api/admin/doctors/:id/reject ───────────────────────────────────────

router.post(
  '/doctors/:id/reject',
  requireAdmin,
  catchAsyncErrors(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    doctor.verificationStatus = 'REJECTED';
    doctor.verificationNote = req.body.note || '';
    await doctor.save();

    res.json({ message: 'Doctor rejected', doctor: doctor.toJSON() });
  })
);

// ── POST /api/admin/doctors/:id/verify-license ───────────────────────────────
// Manually re-trigger the AskMyDoc license check

router.post(
  '/doctors/:id/verify-license',
  requireAdmin,
  catchAsyncErrors(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    let licenseVerified = false;
    try {
      const verifyRes = await axios.get(
        `https://api.askmydoc.in/api/verify?reg_number=${doctor.licenseNumber}`,
        { timeout: 10000 }
      );
      licenseVerified = verifyRes.data?.verified === true && verifyRes.data?.success === true;
    } catch {
      licenseVerified = false;
    }

    doctor.licenseVerified = licenseVerified;
    await doctor.save();

    res.json({ message: 'License check complete', licenseVerified, doctor: doctor.toJSON() });
  })
);

// ── GET /api/admin/patients ───────────────────────────────────────────────────

router.get(
  '/patients',
  requireAdmin,
  catchAsyncErrors(async (req, res) => {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  })
);

// ── GET /api/admin/stats ──────────────────────────────────────────────────────

router.get(
  '/stats',
  requireAdmin,
  catchAsyncErrors(async (req, res) => {
    const pendingFilter = { $or: [{ verificationStatus: 'PENDING' }, { verificationStatus: { $exists: false } }, { verificationStatus: null }] };

    const [totalDoctors, pendingDoctors, approvedDoctors, rejectedDoctors, totalPatients] =
      await Promise.all([
        Doctor.countDocuments(),
        Doctor.countDocuments(pendingFilter),
        Doctor.countDocuments({ verificationStatus: 'APPROVED' }),
        Doctor.countDocuments({ verificationStatus: 'REJECTED' }),
        Patient.countDocuments(),
      ]);

    res.json({ totalDoctors, pendingDoctors, approvedDoctors, rejectedDoctors, totalPatients });
  })
);

export default router;
