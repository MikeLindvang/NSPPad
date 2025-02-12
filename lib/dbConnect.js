import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB; // ✅ Explicitly get the DB name

if (!MONGODB_URI || !MONGODB_DB) {
  throw new Error(
    '❌ MongoDB URI or Database Name is missing in environment variables.'
  );
}

const options = {
  dbName: MONGODB_DB, // ✅ Ensure we connect to the correct database
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const dbConnect = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log(`✅ MongoDB Connected to database: ${MONGODB_DB}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  }
};

export default dbConnect;
