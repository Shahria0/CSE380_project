// ============================================================
// server/index.js — Main Express Server Entry Point
// ============================================================
// WHAT THIS FILE DOES:
// - Loads environment variables from .env
// - Creates the Express app
// - Sets up middleware (CORS, JSON parsing, rate limiting)
// - Mounts all API routes
// - Connects to MongoDB
// - Starts listening on a port
//
// BEGINNER NOTE: This is the "brain" of the backend — it
// orchestrates all the pieces and starts the server.
// ============================================================

// Load .env variables FIRST before importing anything else
// that might use process.env
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// Import our route files
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const userRoutes = require("./routes/users");

// ── CREATE EXPRESS APP ────────────────────────────────────────
const app = express();

// ── MIDDLEWARE ────────────────────────────────────────────────

// CORS (Cross-Origin Resource Sharing)
// BEGINNER NOTE: By default, browsers block requests from one domain
// to another (security feature). CORS headers tell the browser to
// allow requests from our React frontend.
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true, // Allow cookies/auth headers to be sent
  })
);

// Body parser — lets us read req.body in route handlers
// express.json() handles "Content-Type: application/json"
app.use(express.json({ limit: "10mb" })); // 10mb limit for base64 images
app.use(express.urlencoded({ extended: true }));

// ── RATE LIMITING ─────────────────────────────────────────────
// SENIOR NOTE: Rate limiting prevents abuse (brute force attacks,
// scrapers, DDoS). We apply a tighter limit to auth routes.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes per IP
  message: { success: false, message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Only 20 auth attempts per 15 minutes (strict!)
  message: { success: false, message: "Too many login attempts. Please wait and try again." },
});

app.use(generalLimiter);

// ── HEALTH CHECK ──────────────────────────────────────────────
// BEGINNER NOTE: A health check endpoint lets hosting platforms
// (Heroku, Railway, Render) verify the server is running.
// Visit http://localhost:5000/api/health to verify the server is up.
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "EduBridge API is running ✅", env: process.env.NODE_ENV });
});

// ── MOUNT ROUTES ──────────────────────────────────────────────
// All routes are prefixed with /api/
// The path prefix is combined with the paths defined in each router:
//   /api/auth/login → routes/auth.js → POST /login
//   /api/posts      → routes/posts.js → GET /
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);

// ── 404 HANDLER ───────────────────────────────────────────────
// This runs if no route matched the request
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────
// SENIOR NOTE: Express recognizes error-handling middleware by
// the 4-argument signature (err, req, res, next).
// Any route that calls next(error) or throws inside async code
// (if using express-async-errors) ends up here.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages[0] });
  }

  // Mongoose duplicate key error (e.g., duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `An account with this ${field} already exists.`,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

// ── START SERVER ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start listening
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 EduBridge server running on http://localhost:${PORT}`);
    console.log(`📖 API docs (health check): http://localhost:${PORT}/api/health`);
    console.log(`🌍 Accepting requests from: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
  });
});

module.exports = app; // Export for testing purposes
