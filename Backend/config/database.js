// config/database.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // We remove all the extra shard details and let the driver handle it
    const conn = await mongoose.connect(
      "mongodb+srv://amaan_sheikh11:amaan_sheikh11@departmental-store.ue4rht0.mongodb.net/departmental_store?retryWrites=true&w=majority"
    );

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    // Don't exit immediately, let nodemon try to restart
  }
};

export default connectDB;