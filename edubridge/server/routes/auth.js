// ============================================================
// server/routes/auth.js — Authentication Routes
// ============================================================
// Routes handled here:
//   POST /api/auth/register   — Create new account
//   POST /api/auth/login      — Sign in, receive JWT
//   POST /api/auth/forgot-password — Send OTP to email
//   POST /api/auth/verify-otp       — Validate OTP
//   POST /api/auth/reset-password   — Set new password
//   GET  /api/auth/me         — Get current user (requires auth)
// ============================================================

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // Node built-in for generating random tokens
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// ── HELPER: Create and sign a JWT token ──────────────────────
// BEGINNER NOTE: We extract this into a helper so we don't
// repeat the same code in login and register.
const signToken = (userId) => {
  return jwt.sign(
    { id: userId }, // "Payload" — what we embed inside the token
    process.env.JWT_SECRET, // Secret key for signing
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } // Token lifetime
  );
};

// ── HELPER: Send token response ───────────────────────────────
// Sends a consistent JSON response with the token and user data
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove sensitive fields before sending
  // SENIOR NOTE: We convert to plain object so we can delete properties.
  // The password field has select:false in the schema so it won't be here,
  // but resetOtp and resetOtpExpiry are also excluded for safety.
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.resetOtp;
  delete userObj.resetOtpExpiry;

  res.status(statusCode).json({
    success: true,
    token,
    user: userObj,
  });
};

// ── VALIDATION CHAINS ─────────────────────────────────────────
// express-validator lets us declare validation rules as middleware.
// BEGINNER NOTE: These run before the route handler and collect errors.
const registerValidation = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number"),
  body("role").isIn(["student", "alumni"]).withMessage("Invalid role"),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// ── REGISTER ──────────────────────────────────────────────────
// POST /api/auth/register
router.post("/register", registerValidation, async (req, res) => {
  // Check for validation errors from the validation chain above
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return the first validation error message
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      department,
      level,
      graduationYear,
      alumniGradYear,
      alumniField,
      currentRole,
    } = req.body;

    // Check if email is already in use
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        // 409 = Conflict (resource already exists)
        message: "An account with this email already exists.",
      });
    }

    // Create the user — password will be hashed by the pre-save hook in User.js
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      // Only save fields relevant to the role
      ...(role === "student" && { department, level, graduationYear }),
      ...(role === "alumni" && { alumniGradYear, alumniField, currentRole }),
    });

    // Send back the token so the user is immediately logged in after registering
    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────
// POST /api/auth/login
router.post("/login", loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const { email, password } = req.body;

    // Find user by email — we must explicitly select password because
    // the schema has select:false on the password field
    const user = await User.findOne({ email }).select("+password");

    // SECURITY NOTE: We use a generic "Invalid credentials" message for BOTH
    // "email not found" and "wrong password". This prevents "user enumeration"
    // attacks where someone could discover which emails have accounts.
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // Use our model method to compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Your account has been deactivated." });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

// ── GET CURRENT USER ──────────────────────────────────────────
// GET /api/auth/me  (Protected)
// Returns the currently logged-in user's data
router.get("/me", protect, async (req, res) => {
  // protect middleware already attached req.user
  res.json({ success: true, user: req.user });
});

// ── FORGOT PASSWORD (Send OTP) ────────────────────────────────
// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    // SECURITY NOTE: Always return success even if email doesn't exist.
    // This prevents attackers from finding out which emails are registered.
    if (!user) {
      return res.json({
        success: true,
        message: "If an account exists, a reset code has been sent.",
      });
    }

    // Generate a 6-digit OTP
    // crypto.randomInt gives cryptographically secure random numbers
    const otp = crypto.randomInt(100000, 999999).toString();

    // Hash the OTP before storing (same security principle as passwords)
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Store hashed OTP and expiry (10 minutes from now)
    user.resetOtp = hashedOtp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save({ validateBeforeSave: false }); // Skip full validation on partial save

    // ── SEND EMAIL ────────────────────────────────────────
    // BEGINNER NOTE: In development, we just log the OTP.
    // In production, uncomment the nodemailer code below.
    console.log(`\n📧 OTP for ${email}: ${otp}\n`); // Development only!

    // Production email sending (uncomment and configure):
    /*
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"EduBridge" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'EduBridge Password Reset Code',
      html: `<p>Your reset code is: <strong>${otp}</strong></p><p>Expires in 10 minutes.</p>`,
    });
    */

    res.json({
      success: true,
      message: "If an account exists, a reset code has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── VERIFY OTP ────────────────────────────────────────────────
// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Fetch user WITH the hidden resetOtp fields
    const user = await User.findOne({ email: email?.toLowerCase() }).select(
      "+resetOtp +resetOtpExpiry"
    );

    if (!user || !user.resetOtp) {
      return res.status(400).json({ success: false, message: "Invalid or expired code." });
    }

    // Check expiry
    if (user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: "Code has expired. Please request a new one." });
    }

    // Compare submitted OTP against stored hash
    const isValid = await bcrypt.compare(otp, user.resetOtp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid code. Please try again." });
    }

    // OTP is valid — issue a short-lived reset token
    // SENIOR NOTE: We create a temporary JWT just for password reset.
    // This is more secure than keeping the OTP or storing a "verified" flag.
    const resetToken = jwt.sign(
      { id: user._id, purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" } // Only valid for 15 minutes
    );

    res.json({ success: true, resetToken });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── RESET PASSWORD ────────────────────────────────────────────
// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    // Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: "Reset session expired. Please start over." });
    }

    // Ensure the token was created for password reset, not general auth
    if (decoded.purpose !== "password-reset") {
      return res.status(400).json({ success: false, message: "Invalid reset token." });
    }

    const user = await User.findById(decoded.id).select("+resetOtp");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Set new password — the pre-save hook will hash it
    user.password = newPassword;
    // Clear the OTP so it can't be reused
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successfully. Please log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
