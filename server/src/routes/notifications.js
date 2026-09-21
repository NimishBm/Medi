import express from 'express';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// GET /api/notifications — patient's 20 most recent notifications
router.get(
  '/',
  protect,
  authorize('PATIENT'),
  catchAsyncErrors(async (req, res) => {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  })
);

// PUT /api/notifications/read-all — mark all as read
router.put(
  '/read-all',
  protect,
  authorize('PATIENT'),
  catchAsyncErrors(async (req, res) => {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ success: true });
  })
);

// PUT /api/notifications/:id/read — mark one as read
router.put(
  '/:id/read',
  protect,
  authorize('PATIENT'),
  catchAsyncErrors(async (req, res) => {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true }
    );
    res.json({ success: true });
  })
);

export default router;
