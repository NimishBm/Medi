import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// GET /api/notifications — fetch latest 30 for the logged-in doctor/patient
router.get(
  '/',
  protect,
  catchAsyncErrors(async (req, res) => {
    const notifications = await Notification.find({ recipientId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.json({ notifications, unreadCount });
  })
);

// PUT /api/notifications/read-all — mark all unread as read
router.put(
  '/read-all',
  protect,
  catchAsyncErrors(async (req, res) => {
    await Notification.updateMany(
      { recipientId: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );
    res.json({ message: 'All notifications marked as read' });
  })
);

// PUT /api/notifications/:id/read — mark single notification as read
router.put(
  '/:id/read',
  protect,
  catchAsyncErrors(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user.id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  })
);

export default router;
