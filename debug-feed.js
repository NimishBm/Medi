import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BlogPost from './models/BlogPost.js';

dotenv.config();

async function debugFeed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // 1. Check all blogs
    console.log('=== ALL BLOGS IN DB ===');
    const allBlogs = await BlogPost.find();
    console.log(`Total: ${allBlogs.length}`);
    allBlogs.forEach((blog, i) => {
      console.log(`${i + 1}. ${blog.title} | Status: ${blog.status} | Doctor: ${blog.doctorId}`);
    });

    // 2. Check published blogs only
    console.log('\n=== PUBLISHED BLOGS QUERY ===');
    const publishedBlogs = await BlogPost.find({ status: 'published' });
    console.log(`Found: ${publishedBlogs.length}`);
    publishedBlogs.forEach((blog, i) => {
      console.log(`${i + 1}. ${blog.title} | Status: ${blog.status}`);
    });

    // 3. Test the exact feed query
    console.log('\n=== TESTING FEED ENDPOINT QUERY ===');
    const filter = { status: 'published' };
    const feedBlogs = await BlogPost.find(filter)
      .populate('doctorId', 'name specialization')
      .sort({ publishedAt: -1, createdAt: -1 });

    console.log(`Feed result: ${feedBlogs.length} blogs`);
    feedBlogs.forEach((blog, i) => {
      console.log(`${i + 1}. ${blog.title}`);
      console.log(`   Doctor: ${blog.doctorId?.name || 'NO DOCTOR'}`);
      console.log(`   Status: ${blog.status}`);
    });

    // 4. Check doctor references
    console.log('\n=== CHECKING DOCTOR REFERENCES ===');
    const blogsWithoutPopulate = await BlogPost.find({ status: 'published' });
    blogsWithoutPopulate.forEach((blog, i) => {
      console.log(`${i + 1}. ${blog.title} | doctorId: ${blog.doctorId}`);
    });

    await mongoose.disconnect();
    console.log('\nDebug complete!');
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

debugFeed();
