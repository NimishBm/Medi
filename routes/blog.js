import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import BlogPost from '../models/BlogPost.js';
import Doctor from '../models/Doctor.js';
import { protect, authorize } from '../middleware/auth.js';
import { catchAsyncErrors } from '../utils/catchAsyncErrors.js';

const router = express.Router();

// ── image upload setup ────────────────────────────────────────────────────────

const getBlogUploadsDir = () => {
  const dir = process.env.VERCEL
    ? '/tmp/uploads/blog'
    : path.join(process.cwd(), 'uploads', 'blog');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const blogStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, getBlogUploadsDir()),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `blog-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const blogUpload = multer({
  storage: blogStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// GET /api/blog/stats — debug endpoint to see blog statistics
router.get(
  '/stats',
  catchAsyncErrors(async (req, res) => {
    const total = await BlogPost.countDocuments();
    const published = await BlogPost.countDocuments({ status: 'published' });
    const draft = await BlogPost.countDocuments({ status: 'draft' });
    res.json({ total, published, draft });
  })
);

// GET /api/blog/posts — doctor's own posts
router.get(
  '/posts',
  protect,
  authorize('DOCTOR'),
  catchAsyncErrors(async (req, res) => {
    const { status } = req.query;
    const filter = { doctorId: req.user.id };
    if (status && status !== 'all') filter.status = status;

    const posts = await BlogPost.find(filter)
      .populate('doctorId', 'name specialization clinicName profilePhoto')
      .sort({ createdAt: -1 });
    res.json(posts);
  })
);

// GET /api/blog/feed / GET /api/blog/published — all published blogs from all doctors
const getPublishedFeed = catchAsyncErrors(async (req, res) => {
  const { category, search } = req.query;
  const filter = { status: 'published' };

  if (category && category !== 'All') {
    filter.category = category;
  }

  if (search && search.trim()) {
    filter.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { content: { $regex: search.trim(), $options: 'i' } },
      { excerpt: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  // First fetch without populate
  const posts = await BlogPost.find(filter)
    .sort({ publishedAt: -1, createdAt: -1 });

  // Then populate doctor info separately
  const postsWithDoctors = await Promise.all(
    posts.map(async (post) => {
      const postObj = post.toObject();
      try {
        const doctor = await Doctor.findById(post.doctorId)
          .select('name specialization clinicName profilePhoto experience');
        postObj.doctorId = doctor || post.doctorId;
      } catch (err) {
        console.warn('Could not fetch doctor:', err.message);
      }
      return postObj;
    })
  );

  console.log(`[DEBUG] Blog feed returned ${postsWithDoctors.length} posts`);
  res.json(postsWithDoctors);
});

// Allow unauthenticated access to feed for patients
router.get('/feed', getPublishedFeed);
router.get('/published', protect, getPublishedFeed);

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

// POST /api/blog/upload-image — upload a cover image, returns { url }
router.post(
  '/upload-image',
  protect,
  authorize('DOCTOR'),
  blogUpload.single('image'),
  catchAsyncErrors(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    // Build a publicly accessible URL path
    const url = `/uploads/blog/${req.file.filename}`;
    res.json({ url });
  })
);

// ── Admin blog routes (protected by requireAdmin via admin.js middleware) ─────
// These are mounted separately under /api/admin/blog in server.js — see below.
// Exposed here as helpers that admin.js can import:

export const getAdminBlogPosts = catchAsyncErrors(async (req, res) => {
  const { status } = req.query;
  const filter = status && status !== 'all' ? { status } : {};
  const posts = await BlogPost.find(filter)
    .populate('doctorId', 'name specialization')
    .sort({ createdAt: -1 });
  res.json(posts);
});

export const updateBlogPostStatus = catchAsyncErrors(async (req, res) => {
  const { status } = req.body;
  const allowed = ['published', 'draft', 'rejected'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const post = await BlogPost.findByIdAndUpdate(
    req.params.id,
    { status, ...(status === 'published' ? { publishedAt: new Date() } : {}) },
    { new: true }
  ).populate('doctorId', 'name specialization');
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
});

export const deleteBlogPost = catchAsyncErrors(async (req, res) => {
  const post = await BlogPost.findByIdAndDelete(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json({ message: 'Post deleted' });
});

export default router;
