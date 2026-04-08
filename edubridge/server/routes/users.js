// ============================================================
// server/routes/users.js — User Profile Routes
// ============================================================
// Routes handled here:
//   GET    /api/users/:id            — Get any user's public profile
//   PUT    /api/users/profile        — Update own profile (auth)
//   PUT    /api/users/password       — Change password (auth)
//   DELETE /api/users/account        — Delete own account (auth)
//   GET    /api/users/:id/posts      — Get user's posts
//   POST   /api/users/save-post/:id  — Toggle save post (auth)
// ============================================================

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Post = require("../models/Post");
const { protect } = require("../middleware/auth");

// ── GET USER PROFILE (public) ─────────────────────────────────
// GET /api/users/:id
router.get("/:id", async (req, res) => {
  try {
    // Find user but exclude private/sensitive fields
    const user = await User.findById(req.params.id).select(
      "-password -resetOtp -resetOtpExpiry -notifications -savedPosts"
    );

    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({ success: true, user });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── GET USER'S POSTS ──────────────────────────────────────────
// GET /api/users/:id/posts
router.get("/:id/posts", async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.id })
      .sort("-createdAt")
      .populate("author", "firstName lastName role avatar")
      .select("-comments"); // Exclude comments from listing

    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── UPDATE PROFILE ────────────────────────────────────────────
// PUT /api/users/profile  (auth required)
// SENIOR NOTE: This route must be defined BEFORE /:id because
// Express matches routes in order — "profile" would be caught
// by /:id if defined after it.
router.put(
  "/profile",
  protect,
  [
    body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty"),
    body("lastName").optional().trim().notEmpty().withMessage("Last name cannot be empty"),
    body("bio").optional().isLength({ max: 500 }).withMessage("Bio cannot exceed 500 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const {
        firstName,
        lastName,
        bio,
        skills,
        interests,
        linkedIn,
        github,
        website,
        department,
        level,
        graduationYear,
        alumniField,
        currentRole,
        notifications,
      } = req.body;

      // Build update object with only provided fields
      const updates = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (bio !== undefined) updates.bio = bio;
      if (linkedIn !== undefined) updates.linkedIn = linkedIn;
      if (github !== undefined) updates.github = github;
      if (website !== undefined) updates.website = website;
      if (department !== undefined) updates.department = department;
      if (level !== undefined) updates.level = level;
      if (graduationYear !== undefined) updates.graduationYear = graduationYear;
      if (alumniField !== undefined) updates.alumniField = alumniField;
      if (currentRole !== undefined) updates.currentRole = currentRole;
      if (notifications !== undefined) updates.notifications = notifications;

      // Skills and interests can be arrays or comma-separated strings
      if (skills !== undefined) {
        updates.skills = Array.isArray(skills)
          ? skills
          : skills.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (interests !== undefined) {
        updates.interests = Array.isArray(interests)
          ? interests
          : interests.split(",").map((i) => i.trim()).filter(Boolean);
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.json({ success: true, user });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ success: false, message: "Server error." });
    }
  }
);

// ── CHANGE PASSWORD ───────────────────────────────────────────
// PUT /api/users/password  (auth required)
router.put(
  "/password",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const { currentPassword, newPassword } = req.body;

      // Fetch user with password (excluded by default)
      const user = await User.findById(req.user._id).select("+password");

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Current password is incorrect." });
      }

      // Update password — pre-save hook will hash it
      user.password = newPassword;
      await user.save();

      res.json({ success: true, message: "Password updated successfully." });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ success: false, message: "Server error." });
    }
  }
);

// ── TOGGLE SAVE POST ──────────────────────────────────────────
// POST /api/users/save-post/:postId  (auth required)
router.post("/save-post/:postId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const postId = req.params.postId;

    // Check if already saved
    const isSaved = user.savedPosts.includes(postId);

    if (isSaved) {
      user.savedPosts.pull(postId);
    } else {
      user.savedPosts.push(postId);
    }

    await user.save({ validateBeforeSave: false });
    res.json({ success: true, saved: !isSaved });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── DELETE ACCOUNT ────────────────────────────────────────────
// DELETE /api/users/account  (auth required)
// SENIOR NOTE: We "soft delete" by setting isActive=false.
// This preserves data integrity (posts, comments still reference the user).
// A true hard delete would need to cascade-delete all their posts/comments.
router.delete("/account", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    res.json({ success: true, message: "Account deactivated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
