import express from 'express';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import { protect } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

const requireOrg = (req, res, next) => {
  if (req.user.role !== 'ORGANIZATION') {
    return res.status(403).json({ message: 'Only organizations can access this route' });
  }
  next();
};

// GET all approved doctors belonging to this organization
router.get(
  '/doctors',
  protect,
  requireOrg,
  catchAsyncErrors(async (req, res) => {
    const doctors = await Doctor.find({
      organizationId: req.user.id,
      orgMembershipStatus: 'APPROVED',
      isActive: true
    })
      .select('-password')
      .populate('organizationId', 'name orgId');
    res.json(doctors);
  })
);

// GET all PENDING join requests for this organization
router.get(
  '/requests',
  protect,
  requireOrg,
  catchAsyncErrors(async (req, res) => {
    const pending = await Doctor.find({
      pendingOrgId: req.user.id,
      orgMembershipStatus: 'PENDING'
    }).select('-password');
    res.json(pending);
  })
);

// APPROVE a pending join request
router.post(
  '/requests/:doctorId/approve',
  protect,
  requireOrg,
  catchAsyncErrors(async (req, res) => {
    const doctor = await Doctor.findOne({
      _id: req.params.doctorId,
      pendingOrgId: req.user.id,
      orgMembershipStatus: 'PENDING'
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Pending request not found' });
    }

    doctor.organizationId = req.user.id;
    doctor.pendingOrgId = null;
    doctor.orgMembershipStatus = 'APPROVED';
    await doctor.save();

    res.json({ message: `${doctor.name} approved and added to your organization` });
  })
);

// REJECT a pending join request
router.post(
  '/requests/:doctorId/reject',
  protect,
  requireOrg,
  catchAsyncErrors(async (req, res) => {
    const doctor = await Doctor.findOne({
      _id: req.params.doctorId,
      pendingOrgId: req.user.id,
      orgMembershipStatus: 'PENDING'
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Pending request not found' });
    }

    doctor.pendingOrgId = null;
    doctor.orgMembershipStatus = 'NONE';
    await doctor.save();

    res.json({ message: `${doctor.name}'s request has been rejected` });
  })
);

// DIRECT ADD a doctor to this organization (org-initiated, auto-approved)
router.post(
  '/doctors/:doctorId',
  protect,
  requireOrg,
  catchAsyncErrors(async (req, res) => {
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    if (doctor.orgMembershipStatus === 'APPROVED') {
      return res.status(400).json({ message: 'Doctor is already a member of an organization' });
    }

    doctor.organizationId = req.user.id;
    doctor.pendingOrgId = null;
    doctor.orgMembershipStatus = 'APPROVED';
    await doctor.save();

    res.json({ message: 'Doctor added to organization', doctor: doctor.toJSON() });
  })
);

// REMOVE a doctor from this organization
router.delete(
  '/doctors/:doctorId',
  protect,
  requireOrg,
  catchAsyncErrors(async (req, res) => {
    const doctor = await Doctor.findOne({ _id: req.params.doctorId, organizationId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found in your organization' });
    }

    doctor.organizationId = null;
    doctor.orgMembershipStatus = 'NONE';
    await doctor.save();

    res.json({ message: 'Doctor removed from organization' });
  })
);

// GET today's appointments across all org doctors
router.get(
  '/appointments/today',
  protect,
  requireOrg,
  catchAsyncErrors(async (req, res) => {
    const doctors = await Doctor.find({ organizationId: req.user.id, orgMembershipStatus: 'APPROVED' }).select('_id');
    const doctorIds = doctors.map((d) => d._id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      doctorId: { $in: doctorIds },
      appointmentDate: { $gte: today, $lt: tomorrow }
    })
      .populate('patientId', 'name phone')
      .populate('doctorId', 'name specialization roomNumber')
      .sort({ appointmentTime: 1 });

    res.json(appointments);
  })
);

// GET analytics summary for this organization
router.get(
  '/analytics',
  protect,
  requireOrg,
  catchAsyncErrors(async (req, res) => {
    const doctors = await Doctor.find({ organizationId: req.user.id, orgMembershipStatus: 'APPROVED' }).select('_id');
    const doctorIds = doctors.map((d) => d._id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.find({
      doctorId: { $in: doctorIds },
      appointmentDate: { $gte: today, $lt: tomorrow }
    });

    res.json({
      totalDoctors: doctors.length,
      totalAppointmentsToday: todayAppointments.length,
      completedToday: todayAppointments.filter((a) => a.status === 'COMPLETED').length,
      waitingToday: todayAppointments.filter((a) => ['WAITING', 'CHECKED_IN'].includes(a.status)).length,
      cancelledToday: todayAppointments.filter((a) => a.status === 'CANCELLED').length
    });
  })
);

export default router;
