import express from 'express';
import BlogPost from '../models/BlogPost.js';
import { protect, authorize } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// GET /api/blog/posts — doctor's own posts
router.get(
  '/posts',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const { status } = req.query;
    const filter = { doctorId: req.user.id };
    if (status && status !== 'all') filter.status = status;

    const posts = await BlogPost.find(filter).sort({ createdAt: -1 });
    res.json(posts);
  })
);

// POST /api/blog/posts — create
router.post(
  '/posts',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const { title, content, excerpt, category, status, coverImage } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const post = await BlogPost.create({
      doctorId: req.user.id,
      title: title.trim(),
      content,
      excerpt: excerpt?.trim() || content.substring(0, 160),
      category: category || 'General Health',
      status: status || 'draft',
      coverImage: coverImage || '',
      publishedAt: status === 'published' ? new Date() : undefined,
    });

    res.status(201).json(post);
  })
);

// PUT /api/blog/posts/:id — update
router.put(
  '/posts/:id',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const post = await BlogPost.findOne({ _id: req.params.id, doctorId: req.user.id });

    if (!post) return res.status(404).json({ message: 'Post not found' });

    const { title, content, excerpt, category, status, coverImage } = req.body;

    if (title !== undefined)       post.title       = title.trim();
    if (content !== undefined)     post.content     = content;
    if (excerpt !== undefined)     post.excerpt     = excerpt.trim();
    if (category !== undefined)    post.category    = category;
    if (coverImage !== undefined)  post.coverImage  = coverImage;
    if (status !== undefined) {
      post.status = status;
      if (status === 'published' && !post.publishedAt) post.publishedAt = new Date();
    }

    await post.save();
    res.json(post);
  })
);

// DELETE /api/blog/posts/:id
router.delete(
  '/posts/:id',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const post = await BlogPost.findOneAndDelete({ _id: req.params.id, doctorId: req.user.id });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ message: 'Post deleted' });
  })
);

// POST /api/blog/posts/:id/view — increment view count
router.post(
  '/posts/:id/view',
  catchAsyncErrors(async (req, res) => {
    await BlogPost.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ ok: true });
  })
);

export default router;
