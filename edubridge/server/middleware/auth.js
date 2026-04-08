// ============================================================
// server/middleware/auth.js — JWT Authentication Middleware
// ============================================================
// WHAT IS MIDDLEWARE? In Express, middleware is a function that
// runs BETWEEN receiving a request and sending a response.
// Think of it as a "bouncer" — it checks if the user is allowed
// in before passing the request to the actual route handler.
//
// HOW JWT WORKS:
// 1. User logs in → server creates a signed JWT token
// 2. Client stores the token (usually in localStorage)
// 3. Client sends the token in every subsequent request header
// 4. This middleware validates that token on protected routes
// ============================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ── PROTECT MIDDLEWARE ────────────────────────────────────────
// Add this to any route that requires login:
//   router.get('/profile', protect, profileHandler)
const protect = async (req, res, next) => {
  let token;

  // JWT tokens are sent in the "Authorization" header as:
  //   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Split "Bearer <token>" and take the token part [1]
    token = req.headers.authorization.split(" ")[1];
  }

  // If no token was found, reject the request
  if (!token) {
    return res.status(401).json({
      success: false,
      // 401 = Unauthorized (not logged in)
      message: "Not authorized. Please log in.",
    });
  }

  try {
    // jwt.verify() checks:
    // 1. The token signature matches our secret (wasn't tampered with)
    // 2. The token hasn't expired
    // If either check fails, it throws an error (caught below)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded.id is the user's MongoDB _id we embedded when creating the token
    // We fetch fresh user data from DB so we always have up-to-date info
    // SENIOR NOTE: We don't select password here — it's excluded by default
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists or account is deactivated.",
      });
    }

    // Attach user to the request object so route handlers can access it
    // BEGINNER NOTE: req.user is now available in all subsequent middleware
    // and route handlers in the chain
    req.user = user;
    next(); // Pass control to the next middleware/route handler
  } catch (error) {
    // This catches expired tokens, invalid signatures, etc.
    const message =
      error.name === "TokenExpiredError"
        ? "Your session has expired. Please log in again."
        : "Invalid token. Please log in.";

    return res.status(401).json({ success: false, message });
  }
};

// ── OPTIONAL AUTH MIDDLEWARE ──────────────────────────────────
// Like protect, but doesn't reject if no token.
// Useful for routes that show different content to logged-in users
// but are also accessible publicly (e.g., viewing a post).
const optionalAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    req.user = null; // No user — that's OK
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
  } catch {
    req.user = null; // Invalid token — treat as unauthenticated
  }
  next();
};

module.exports = { protect, optionalAuth };
