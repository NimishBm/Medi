import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// GET /api/notifications — fetch latest 30 for the logged-in user
router.get(
  '/',
  protect,
  catchAsyncErrors(async (req, res) => {
    const query = {
      $or: [{ recipientId: req.user.id }, { userId: req.user.id }],
    };
    const notifications = await Notification.find(query)
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
      { $or: [{ recipientId: req.user.id }, { userId: req.user.id }], read: false },
      { read: true, readAt: new Date() }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  })
);

// PUT /api/notifications/:id/read — mark single notification as read
router.put(
  '/:id/read',
  protect,
  catchAsyncErrors(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, $or: [{ recipientId: req.user.id }, { userId: req.user.id }] },
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
