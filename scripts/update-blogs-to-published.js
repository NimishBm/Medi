import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BlogPost from '../models/BlogPost.js';

dotenv.config();

async function updateBlogsToPublished() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all blogs with status 'draft'
    const draftBlogs = await BlogPost.find({ status: 'draft' });
    console.log(`Found ${draftBlogs.length} draft blogs`);

    // Update all draft blogs to published
    const result = await BlogPost.updateMany(
      { status: 'draft' },
      {
        $set: {
          status: 'published',
          publishedAt: new Date(),
        },
      }
    );

    console.log(`Updated ${result.modifiedCount} blogs to published status`);

    // Verify
    const publishedBlogs = await BlogPost.find({ status: 'published' });
    console.log(`Total published blogs now: ${publishedBlogs.length}`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateBlogsToPublished();
