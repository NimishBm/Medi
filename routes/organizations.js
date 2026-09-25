import express from 'express';
import Organization from '../models/Organization.js';
import OrganizationDoctor from '../models/OrganizationDoctor.js';
import Doctor from '../models/Doctor.js';
import { protect, authorize } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// GET / — list all active, approved organizations
router.get(
  '/',
  catchAsyncErrors(async (req, res) => {
    const orgs = await Organization.find({
      isActive: { $ne: false },
      verificationStatus: { $in: ['APPROVED', null] },
    })
      .sort({ name: 1 })
      .lean();

    const result = await Promise.all(
      orgs.map(async (org) => {
        const doctorCount = await OrganizationDoctor.countDocuments({ organizationId: org._id });
        return { ...org, doctorCount };
      })
    );

    res.json({ success: true, organizations: result });
  })
);

// POST / — create an organization (admin only)
router.post(
  '/',
  protect,
  authorize('ADMIN'),
  catchAsyncErrors(async (req, res) => {
    const { name, organizationId, type, description, city, address, phone, email, website, specialties, logo } = req.body;

    if (!name || !organizationId) {
      return res.status(400).json({ message: 'name and organizationId are required' });
    }

    const org = await Organization.create({
      name, organizationId, type, description, city, address, phone, email, website,
      specialties: specialties || [],
      logo: logo || '',
    });

    res.status(201).json({ success: true, organization: org });
  })
);

// PUT /:id — update organization details (admin only)
router.put(
  '/:id',
  protect,
  authorize('ADMIN'),
  catchAsyncErrors(async (req, res) => {
    const allowed = ['name', 'type', 'description', 'logo', 'address', 'city', 'phone', 'email', 'website', 'specialties', 'isActive', 'verificationStatus'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const org = await Organization.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

    if (!org) return res.status(404).json({ message: 'Organization not found' });

    res.json({ success: true, organization: org });
  })
);

// POST /:id/doctors — link a doctor to this organization (admin only)
router.post(
  '/:id/doctors',
  protect,
  authorize('ADMIN'),
  catchAsyncErrors(async (req, res) => {
    const { doctorId } = req.body;
    if (!doctorId) return res.status(400).json({ message: 'doctorId is required' });

    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    // Upsert join record (compound unique index prevents duplicates)
    await OrganizationDoctor.findOneAndUpdate(
      { organizationId: org._id, doctorId: doctor._id },
      { organizationId: org._id, doctorId: doctor._id },
      { upsert: true, new: true }
    );

    // Keep denormalized array on Doctor in sync
    if (!doctor.organizationIds.map(String).includes(String(org._id))) {
      await Doctor.findByIdAndUpdate(doctorId, { $addToSet: { organizationIds: org._id } });
    }

    res.json({ success: true, message: 'Doctor linked to organization' });
  })
);

// DELETE /:id/doctors/:doctorId — unlink a doctor (admin only)
router.delete(
  '/:id/doctors/:doctorId',
  protect,
  authorize('ADMIN'),
  catchAsyncErrors(async (req, res) => {
    await OrganizationDoctor.deleteOne({ organizationId: req.params.id, doctorId: req.params.doctorId });
    await Doctor.findByIdAndUpdate(req.params.doctorId, { $pull: { organizationIds: req.params.id } });

    res.json({ success: true, message: 'Doctor removed from organization' });
  })
);

// POST /join — doctor joins an organization (self-link only)
router.post(
  '/join',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const { organizationId } = req.body;
    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'organizationId is required' });
    }

    const org = await Organization.findById(organizationId);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    await OrganizationDoctor.findOneAndUpdate(
      { organizationId: org._id, doctorId: req.user.id },
      { organizationId: org._id, doctorId: req.user.id },
      { upsert: true, new: true }
    );

    await Doctor.findByIdAndUpdate(req.user.id, { $addToSet: { organizationIds: org._id } });

    res.json({ success: true, message: `Joined ${org.name}` });
  })
);

// DELETE /leave/:orgId — doctor leaves an organization
router.delete(
  '/leave/:orgId',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    await OrganizationDoctor.deleteOne({ organizationId: req.params.orgId, doctorId: req.user.id });
    await Doctor.findByIdAndUpdate(req.user.id, { $pull: { organizationIds: req.params.orgId } });
    res.json({ success: true, message: 'Left organization' });
  })
);

// GET /my — get authenticated doctor's linked organizations
router.get(
  '/my',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const links = await OrganizationDoctor.find({ doctorId: req.user.id })
      .populate('organizationId')
      .lean();
    const organizations = links.map(l => l.organizationId).filter(Boolean);
    res.json({ success: true, organizations });
  })
);

// Search organizations
router.get('/search', catchAsyncErrors(async (req, res) => {
    const query = (req.query.q || '').trim();

    if (query.length < 2) {
      return res.json({
        success: true,
        organizations: []
      });
    }

    const organizations = await Organization.find({
      name: { $regex: query, $options: 'i' }
    }).lean();

    const result = await Promise.all(
      organizations.map(async (organization) => {
        const organizationDoctors =
          await OrganizationDoctor.find({
            organizationId: organization._id
          })
            .populate({
              path: 'doctorId',
              select: '-password',
              match: { verificationStatus: { $ne: 'REJECTED' } }
            })
            .lean();

        return {
          ...organization,
          doctors: organizationDoctors
            .map((item) => item.doctorId)
            .filter(Boolean)
        };
      })
    );

    res.json({
      success: true,
      organizations: result
    });
}));

// Get one organization and its doctors
router.get('/:id', async (req, res) => {
  try {
    const organization = await Organization.findById(
      req.params.id
    ).lean();

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    const organizationDoctors =
      await Doctor.find({
        organizationId: organization._id,
         verificationStatus: { $ne: 'REJECTED' } 
      }).lean();

    res.json({
      success: true,
      organization,
      doctors: organizationDoctors
        .map((item) => item._id)
        .filter(Boolean)
    });
  } catch (error) {
    console.error('Organization fetch error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization'
    });
  }
});

export default router;