import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BlogPost from './models/BlogPost.js';

dotenv.config();

async function testBlogAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check all blogs
    const allBlogs = await BlogPost.find();
    console.log(`\n=== ALL BLOGS ===`);
    console.log(`Total: ${allBlogs.length}`);
    allBlogs.forEach(blog => {
      console.log(`- ${blog.title} (Doctor: ${blog.doctorId}, Status: ${blog.status})`);
    });

    // Check published blogs
    const publishedBlogs = await BlogPost.find({ status: 'published' });
    console.log(`\n=== PUBLISHED BLOGS ===`);
    console.log(`Total: ${publishedBlogs.length}`);
    publishedBlogs.forEach(blog => {
      console.log(`- ${blog.title} (Doctor: ${blog.doctorId}, Status: ${blog.status})`);
    });

    // Check with populate
    const publishedWithDoctor = await BlogPost.find({ status: 'published' })
      .populate('doctorId', 'name specialization');
    console.log(`\n=== PUBLISHED BLOGS WITH DOCTOR INFO ===`);
    console.log(`Total: ${publishedWithDoctor.length}`);
    publishedWithDoctor.forEach(blog => {
      console.log(`- ${blog.title} (Doctor: ${blog.doctorId?.name || 'NO DOCTOR'}, Status: ${blog.status})`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testBlogAPI();
