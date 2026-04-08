// ============================================================
// server/config/db.js — MongoDB Connection
// ============================================================
// WHAT THIS DOES: Connects our Express server to MongoDB using
// Mongoose, which is an "ODM" (Object Data Mapper) — it lets
// us work with MongoDB data using JavaScript objects instead
// of raw database queries.
// ============================================================

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // mongoose.connect() returns a Promise, so we use await
    // process.env.MONGO_URI reads from your .env file
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options suppress deprecation warnings in newer Mongoose versions
      // SENIOR NOTE: In Mongoose 8+, these are the defaults — but explicitly
      // setting them documents intent and prevents confusion.
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If connection fails, log the error and exit the process
    // Exit code 1 means "failure" — tells hosting platforms the app crashed
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
