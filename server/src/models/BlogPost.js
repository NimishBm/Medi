import mongoose from 'mongoose';

const blogPostSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String, // URL or upload path
    },
    category: {
      type: String,
      default: 'General Health',
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'published', 'rejected'],
      default: 'draft',
    },
    views: {
      type: Number,
      default: 0,
    },
    publishedAt: Date,
  },
  { timestamps: true }
);

blogPostSchema.index({ doctorId: 1, createdAt: -1 });

export default mongoose.model('BlogPost', blogPostSchema);
