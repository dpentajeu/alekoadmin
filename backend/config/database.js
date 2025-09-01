const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aleko_admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Additional options for cloud MongoDB
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create default admin if none exists
    await createDefaultAdmin();
    
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const createDefaultAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL || 'admin@aleko.com' });
    
    if (!adminExists) {
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      await Admin.create({
        email: process.env.ADMIN_EMAIL || 'admin@aleko.com',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'super_admin'
      });
      
      console.log('Default admin account created');
      console.log(`Email: ${process.env.ADMIN_EMAIL || 'admin@aleko.com'}`);
      console.log(`Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

module.exports = connectDB;

