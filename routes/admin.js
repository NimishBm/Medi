import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import Admin from '../models/Admin.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Consultation from '../models/Consultation.js';
import Prescription from '../models/Prescription.js';
import Payment from '../models/Payment.js';
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

// ── POST /api/admin/doctors ───────────────────────────────────────────────────

router.post(
  '/doctors',
  requireAdmin,
  catchAsyncErrors(async (req, res) => {
    const { name, email, phone, password, specialization, experience, consultationFee,
            licenseNumber, clinicName, clinicCity, verificationStatus, isActive } = req.body;

    if (!name || !email || !phone || !password || !specialization) {
      return res.status(400).json({ message: 'name, email, phone, password and specialization are required' });
    }

    const existing = await Doctor.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const doctor = await Doctor.create({
      name, email, phone, password, specialization,
      experience: experience || 0,
      consultationFee: consultationFee || 0,
      licenseNumber: licenseNumber || '',
      clinicName: clinicName || '',
      clinicCity: clinicCity || '',
      verificationStatus: verificationStatus || 'PENDING',
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ message: 'Doctor created', doctor: doctor.toJSON() });
  })
);

// ── PUT /api/admin/doctors/:id ────────────────────────────────────────────────

router.put(
  '/doctors/:id',
  requireAdmin,
  catchAsyncErrors(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const { password, qualifications, ...rest } = req.body;
    Object.assign(doctor, rest);
    if (qualifications !== undefined) {
      doctor.qualifications = Array.isArray(qualifications)
        ? qualifications
        : qualifications.split(',').map((q) => q.trim()).filter(Boolean);
    }
    if (password) doctor.password = password;
    await doctor.save();

    res.json({ message: 'Doctor updated', doctor: doctor.toJSON() });
  })
);

// ── DELETE /api/admin/doctors/:id ─────────────────────────────────────────────

router.delete(
  '/doctors/:id',
  requireAdmin,
  catchAsyncErrors(async (req, res) => {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor deleted' });
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

// ── GET /api/admin/patients/:id ───────────────────────────────────────────────

router.get(
  '/patients/:id',
  requireAdmin,
  catchAsyncErrors(async (req, res) => {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  })
);

// ── POST /api/admin/patients ──────────────────────────────────────────────────

router.post(
  '/patients',
  requireAdmin,
  catchAsyncErrors(async (req, res) => {
    const { name, email, phone, password, gender, dateOfBirth, bloodGroup, allergies } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'name, email, phone and password are required' });
    }

    const existing = await Patient.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const patient = await Patient.create({
      name, email, phone, password,
      gender: gender || undefined,
      dateOfBirth: dateOfBirth || undefined,
      bloodGroup: bloodGroup || undefined,
      allergies: Array.isArray(allergies) ? allergies : (allergies ? allergies.split(',').map((a) => a.trim()).filter(Boolean) : []),
    });

    res.status(201).json({ message: 'Patient created', patient: patient.toJSON() });
  })
);

// ── PUT /api/admin/patients/:id ───────────────────────────────────────────────

router.put(
  '/patients/:id',
  requireAdmin,
  catchAsyncErrors(async (req, res) => {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const { password, allergies, ...rest } = req.body;
    Object.assign(patient, rest);
    if (allergies !== undefined) {
      patient.allergies = Array.isArray(allergies)
        ? allergies
        : allergies.split(',').map((a) => a.trim()).filter(Boolean);
    }
    if (password) patient.password = password;
    await patient.save();

    res.json({ message: 'Patient updated', patient: patient.toJSON() });
  })
);

// ── DELETE /api/admin/patients/:id ────────────────────────────────────────────

router.delete(
  '/patients/:id',
  requireAdmin,
  catchAsyncErrors(async (req, res) => {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient deleted' });
  })
);

// ── GET /api/admin/doctors/:id/full ──────────────────────────────────────────
// Returns doctor + all appointments, consultations, unique patients, payments

router.get(
  '/doctors/:id/full',
  requireAdmin,
  catchAsyncErrors(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const [appointments, consultations, payments] = await Promise.all([
      Appointment.find({ doctorId: req.params.id })
        .sort({ appointmentDate: -1 })
        .limit(200)
        .populate('patientId', 'name email phone'),
      Consultation.find({ doctorId: req.params.id })
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('patientId', 'name email'),
      Payment.find({ doctorId: req.params.id })
        .sort({ createdAt: -1 })
        .limit(200)
        .populate('patientId', 'name email'),
    ]);

    // build unique-patient map
    const patientMap = new Map();
    appointments.forEach((a) => {
      if (a.patientId) {
        const p = a.patientId;
        const key = p._id.toString();
        if (!patientMap.has(key)) {
          patientMap.set(key, { _id: p._id, name: p.name, email: p.email, phone: p.phone, appointmentCount: 0 });
        }
        patientMap.get(key).appointmentCount++;
      }
    });

    const revenueStats = {
      total:    payments.reduce((s, p) => s + p.totalAmount, 0),
      paid:     payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.totalAmount, 0),
      pending:  payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.totalAmount, 0),
      refunded: payments.filter((p) => p.status === 'REFUNDED').reduce((s, p) => s + p.totalAmount, 0),
    };

    res.json({
      doctor: doctor.toJSON(),
      appointments,
      consultations,
      payments,
      patients: Array.from(patientMap.values()),
      revenueStats,
    });
  })
);

// ── GET /api/admin/patients/:id/full ─────────────────────────────────────────
// Returns patient + all appointments, prescriptions, payments, consultations

router.get(
  '/patients/:id/full',
  requireAdmin,
  catchAsyncErrors(async (req, res) => {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const [appointments, prescriptions, payments, consultations] = await Promise.all([
      Appointment.find({ patientId: req.params.id })
        .sort({ appointmentDate: -1 })
        .limit(200)
        .populate('doctorId', 'name specialization clinicName clinicCity'),
      Prescription.find({ patientId: req.params.id })
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('doctorId', 'name specialization'),
      Payment.find({ patientId: req.params.id })
        .sort({ createdAt: -1 })
        .limit(200)
        .populate('doctorId', 'name specialization'),
      Consultation.find({ patientId: req.params.id })
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('doctorId', 'name specialization'),
    ]);

    res.json({
      patient: patient.toJSON(),
      appointments,
      prescriptions,
      payments,
      consultations,
    });
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
