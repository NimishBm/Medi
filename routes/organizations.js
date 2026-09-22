import express from 'express';
import Organization from '../models/Organization.js';
import OrganizationDoctor from '../models/OrganizationDoctor.js';
import Doctor from '../models/Doctor.js';

const router = express.Router();

// Search organizations
router.get('/search', async (req, res) => {
  try {
    const query = (req.query.q || '').trim();

    if (query.length < 4) {
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
  } catch (error) {
    console.error('Organization search error:', error);

    res.status(500).json({
      success: false,
      message: 'Organization search failed'
    });
  }
});

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
      await OrganizationDoctor.find({
        organizationId: organization._id
      })
        .populate({
          path: 'doctorId',
          select: '-password',
          match: { verificationStatus: { $ne: 'REJECTED' } }
        })
        .lean();

    res.json({
      success: true,
      organization,
      doctors: organizationDoctors
        .map((item) => item.doctorId)
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