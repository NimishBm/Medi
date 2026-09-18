import express from 'express';
import axios from 'axios';
import { protect } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';
import User from '../models/User.js';

const router = express.Router();

const getWpAuthHeader = (username, appPassword) => {
  const credentials = `${username}:${appPassword}`;
  const encoded = Buffer.from(credentials).toString('base64');
  return `Basic ${encoded}`;
};

router.get(
  '/posts',
  protect,
  catchAsyncErrors(async (req, res) => {
    const doctor = await User.findById(req.user.id);

    if (!doctor?.wpSiteUrl || !doctor?.wpUsername || !doctor?.wpAppPassword) {
      return res.status(400).json({ message: 'WordPress credentials not configured' });
    }

    try {
      const wpUrl = doctor.wpSiteUrl.replace(/\/$/, '');
      const response = await axios.get(`${wpUrl}/wp-json/wp/v2/posts`, {
        headers: {
          Authorization: getWpAuthHeader(doctor.wpUsername, doctor.wpAppPassword),
        },
        params: {
          author_name: doctor.wpUsername,
          per_page: 50,
          _embed: true,
        },
      });

      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({
        message: error.response?.data?.message || 'Failed to fetch posts from WordPress',
      });
    }
  })
);

router.post(
  '/posts',
  protect,
  catchAsyncErrors(async (req, res) => {
    const doctor = await User.findById(req.user.id);

    if (!doctor?.wpSiteUrl || !doctor?.wpUsername || !doctor?.wpAppPassword) {
      return res.status(400).json({ message: 'WordPress credentials not configured' });
    }

    const { title, content, excerpt, status = 'draft', categories = [] } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    try {
      const wpUrl = doctor.wpSiteUrl.replace(/\/$/, '');
      const response = await axios.post(
        `${wpUrl}/wp-json/wp/v2/posts`,
        {
          title,
          content,
          excerpt,
          status,
          categories,
        },
        {
          headers: {
            Authorization: getWpAuthHeader(doctor.wpUsername, doctor.wpAppPassword),
            'Content-Type': 'application/json',
          },
        }
      );

      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({
        message: error.response?.data?.message || 'Failed to create post in WordPress',
      });
    }
  })
);

router.put(
  '/posts/:id',
  protect,
  catchAsyncErrors(async (req, res) => {
    const doctor = await User.findById(req.user.id);

    if (!doctor?.wpSiteUrl || !doctor?.wpUsername || !doctor?.wpAppPassword) {
      return res.status(400).json({ message: 'WordPress credentials not configured' });
    }

    const { title, content, excerpt, status, categories } = req.body;

    try {
      const wpUrl = doctor.wpSiteUrl.replace(/\/$/, '');
      const response = await axios.post(
        `${wpUrl}/wp-json/wp/v2/posts/${req.params.id}`,
        {
          title,
          content,
          excerpt,
          status,
          categories,
        },
        {
          headers: {
            Authorization: getWpAuthHeader(doctor.wpUsername, doctor.wpAppPassword),
            'Content-Type': 'application/json',
          },
        }
      );

      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({
        message: error.response?.data?.message || 'Failed to update post in WordPress',
      });
    }
  })
);

router.delete(
  '/posts/:id',
  protect,
  catchAsyncErrors(async (req, res) => {
    const doctor = await User.findById(req.user.id);

    if (!doctor?.wpSiteUrl || !doctor?.wpUsername || !doctor?.wpAppPassword) {
      return res.status(400).json({ message: 'WordPress credentials not configured' });
    }

    try {
      const wpUrl = doctor.wpSiteUrl.replace(/\/$/, '');
      await axios.delete(`${wpUrl}/wp-json/wp/v2/posts/${req.params.id}`, {
        headers: {
          Authorization: getWpAuthHeader(doctor.wpUsername, doctor.wpAppPassword),
        },
        params: {
          force: true,
        },
      });

      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      res.status(error.response?.status || 500).json({
        message: error.response?.data?.message || 'Failed to delete post from WordPress',
      });
    }
  })
);

router.get(
  '/categories',
  protect,
  catchAsyncErrors(async (req, res) => {
    const doctor = await User.findById(req.user.id);

    if (!doctor?.wpSiteUrl || !doctor?.wpUsername || !doctor?.wpAppPassword) {
      return res.status(400).json({ message: 'WordPress credentials not configured' });
    }

    try {
      const wpUrl = doctor.wpSiteUrl.replace(/\/$/, '');
      const response = await axios.get(`${wpUrl}/wp-json/wp/v2/categories`, {
        headers: {
          Authorization: getWpAuthHeader(doctor.wpUsername, doctor.wpAppPassword),
        },
        params: {
          per_page: 50,
        },
      });

      res.json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({
        message: error.response?.data?.message || 'Failed to fetch categories from WordPress',
      });
    }
  })
);

export default router;
