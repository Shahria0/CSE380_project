// ============================================================
// server/routes/posts.js — Post CRUD Routes
// ============================================================
// Routes handled here:
//   GET    /api/posts           — List all posts (with filters)
//   POST   /api/posts           — Create a post (auth required)
//   GET    /api/posts/:id       — Get single post with comments
//   PUT    /api/posts/:id       — Edit post (auth + ownership)
//   DELETE /api/posts/:id       — Delete post (auth + ownership)
//   POST   /api/posts/:id/comment      — Add comment
//   POST   /api/posts/:id/interest     — Express interest (toggle)
//   POST   /api/posts/:id/view         — Increment view count
// ============================================================

const express = require("express");
const router = express.Router();
const { body, query, validationResult } = require("express-validator");
const Post = require("../models/Post");
const { protect, optionalAuth } = require("../middleware/auth");

// ── GET ALL POSTS (with filtering, search, pagination) ────────
// GET /api/posts?type=project&search=AI&page=1&limit=9
router.get("/", optionalAuth, async (req, res) => {
  try {
    const {
      type,        // Filter by post type (project/thesis/experience)
      search,      // Full-text search query
      department,  // Filter by department
      page = 1,    // Pagination: current page (default 1)
      limit = 9,   // Items per page (default 9)
      sort = "-createdAt", // Sort field (- prefix = descending)
    } = req.query;

    // Build the MongoDB query object dynamically
    // BEGINNER NOTE: We only add filters if they're provided in the URL
    const filter = {};

    if (type && type !== "all") {
      filter.type = type;
    }

    if (department) {
      filter.department = department;
    }

    // Full-text search using the text index we created in the Post schema
    if (search) {
      filter.$text = { $search: search };
    }

    // Convert page/limit to numbers (URL params are always strings)
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Cap at 50
    const skip = (pageNum - 1) * limitNum;

    // Run query and count in parallel for efficiency
    // SENIOR NOTE: Promise.all runs both DB queries simultaneously instead
    // of waiting for one to finish before starting the other.
    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate("author", "firstName lastName role department currentRole alumniGradYear avatar") // Replace author ID with actual user data
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select("-comments"), // Don't send comments in listing view (saves bandwidth)
      Post.countDocuments(filter),
    ]);

    res.json({
      success: true,
      posts,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── GET SINGLE POST (with full comments) ─────────────────────
// GET /api/posts/:id
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "firstName lastName role department currentRole alumniGradYear avatar bio skills")
      .populate("comments.author", "firstName lastName role avatar"); // Populate comment authors too

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    res.json({ success: true, post });
  } catch (error) {
    // If the ID format is invalid, Mongoose throws a CastError
    if (error.name === "CastError") {
      return res.status(404).json({ success: false, message: "Post not found." });
    }
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── CREATE POST ───────────────────────────────────────────────
// POST /api/posts  (auth required)
router.post(
  "/",
  protect, // Must be logged in
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description").trim().notEmpty().withMessage("Description is required"),
    body("type").isIn(["project", "thesis", "experience"]).withMessage("Invalid post type"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const { title, description, details, type, tags, department, lookingFor, deadline, status } = req.body;

      // Parse tags — can come as comma-separated string or array
      let parsedTags = [];
      if (tags) {
        parsedTags = Array.isArray(tags)
          ? tags
          : tags.split(",").map((t) => t.trim()).filter(Boolean);
      }

      const post = await Post.create({
        title,
        description,
        details,
        type,
        tags: parsedTags,
        department,
        lookingFor,
        status: status || "open",
        // deadline is optional — only save if provided and valid
        ...(deadline && { deadline: new Date(deadline) }),
        // req.user is set by the protect middleware
        author: req.user._id,
      });

      // Populate author info before sending back
      await post.populate("author", "firstName lastName role avatar");

      res.status(201).json({ success: true, post });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ success: false, message: "Server error." });
    }
  }
);

// ── UPDATE POST ───────────────────────────────────────────────
// PUT /api/posts/:id  (auth + ownership required)
router.put("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    // AUTHORIZATION CHECK: Only the author can edit their post
    // .toString() converts ObjectId to string for comparison
    if (post.author.toString() !== req.user._id.toString()) {
      // 403 = Forbidden (logged in but not allowed)
      return res.status(403).json({ success: false, message: "Not authorized to edit this post." });
    }

    const { title, description, details, tags, department, lookingFor, deadline, status } = req.body;

    let parsedTags = post.tags; // Keep existing tags if not updated
    if (tags !== undefined) {
      parsedTags = Array.isArray(tags)
        ? tags
        : tags.split(",").map((t) => t.trim()).filter(Boolean);
    }

    // Update only the fields that were provided
    // SENIOR NOTE: findByIdAndUpdate with $set is cleaner than
    // manually setting each field, and automatically runs validators
    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...(title && { title }),
          ...(description && { description }),
          ...(details !== undefined && { details }),
          tags: parsedTags,
          ...(department && { department }),
          ...(lookingFor !== undefined && { lookingFor }),
          ...(status && { status }),
          ...(deadline && { deadline: new Date(deadline) }),
        },
      },
      { new: true, runValidators: true } // new:true returns the updated doc
    ).populate("author", "firstName lastName role avatar");

    res.json({ success: true, post: updated });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── DELETE POST ───────────────────────────────────────────────
// DELETE /api/posts/:id  (auth + ownership required)
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this post." });
    }

    await post.deleteOne();
    res.json({ success: true, message: "Post deleted successfully." });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── ADD COMMENT ───────────────────────────────────────────────
// POST /api/posts/:id/comment  (auth required)
router.post("/:id/comment", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: "Comment text is required." });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    // Push new comment to the embedded array
    post.comments.push({ author: req.user._id, text: text.trim() });
    await post.save();

    // Populate author info for the newly added comment
    await post.populate("comments.author", "firstName lastName role avatar");

    // Return just the new comment (the last one in the array)
    const newComment = post.comments[post.comments.length - 1];
    res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    console.error("Comment error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── EXPRESS INTEREST (toggle) ─────────────────────────────────
// POST /api/posts/:id/interest  (auth required)
// Calling this endpoint toggles the user's interest (add/remove)
router.post("/:id/interest", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const userId = req.user._id;
    // Check if user already expressed interest
    const alreadyInterested = post.interestedUsers.includes(userId);

    if (alreadyInterested) {
      // Remove from array (toggle off)
      post.interestedUsers.pull(userId);
    } else {
      // Add to array (toggle on)
      post.interestedUsers.push(userId);
    }

    await post.save();
    res.json({
      success: true,
      interested: !alreadyInterested,
      interestCount: post.interestedUsers.length,
    });
  } catch (error) {
    console.error("Interest error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── INCREMENT VIEW COUNT ──────────────────────────────────────
// POST /api/posts/:id/view (public)
// Called when a user opens a post detail page
router.post("/:id/view", async (req, res) => {
  try {
    // $inc atomically increments the views field by 1
    // SENIOR NOTE: $inc is better than read-then-write for counters
    // because it avoids race conditions (two requests reading 5, both
    // writing 6 instead of 7)
    await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch {
    res.json({ success: true }); // Silently fail — view count isn't critical
  }
});

module.exports = router;
