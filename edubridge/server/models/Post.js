// ============================================================
// server/models/Post.js — Post Data Model
// ============================================================
// Posts represent project ideas, thesis topics, or experiences
// shared by students and alumni on EduBridge.
// ============================================================

const mongoose = require("mongoose");

// ── COMMENT SUB-SCHEMA ────────────────────────────────────────
// BEGINNER NOTE: Instead of a separate Comments collection,
// we embed comments directly inside each Post document.
// This is called "embedding" in MongoDB and works well when
// comments are always accessed with their post.
// The tradeoff: if a post gets 10,000 comments, the document
// becomes huge. For that scale, a separate collection is better.
const CommentSchema = new mongoose.Schema(
  {
    // ref: 'User' tells Mongoose this ObjectId links to the User model
    // This enables .populate() to replace the ID with actual user data
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
  },
  { timestamps: true }
);

// ── MAIN POST SCHEMA ─────────────────────────────────────────
const PostSchema = new mongoose.Schema(
  {
    // ── CONTENT ───────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    // Optional longer-form content (details, methodology, etc.)
    details: { type: String, default: "" },

    // ── TYPE ──────────────────────────────────────────────
    // What kind of post is this?
    type: {
      type: String,
      enum: ["project", "thesis", "experience"],
      required: [true, "Post type is required"],
    },

    // ── METADATA ──────────────────────────────────────────
    tags: [{ type: String, trim: true, lowercase: true }],
    department: { type: String, trim: true },
    status: {
      type: String,
      enum: ["open", "closed", "completed"],
      default: "open",
    },

    // For project/thesis posts — optional deadline
    deadline: { type: Date },

    // ── COLLABORATION ─────────────────────────────────────
    // Array of user IDs who have expressed interest
    interestedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Looking for specific roles/skills
    lookingFor: { type: String, default: "" },

    // ── AUTHOR ────────────────────────────────────────────
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Post must have an author"],
    },

    // ── ENGAGEMENT ────────────────────────────────────────
    // SENIOR NOTE: We store view count as a simple number.
    // For high-traffic sites, use Redis for counters instead
    // to avoid write contention on the same document.
    views: { type: Number, default: 0 },

    // Embedded comments array using the sub-schema defined above
    comments: [CommentSchema],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    // toJSON virtuals (e.g., computed fields) show up in API responses
    toJSON: { virtuals: true },
  }
);

// ── INDEX FOR SEARCH ──────────────────────────────────────────
// SENIOR NOTE: Text indexes let MongoDB do full-text search on
// title, description, and tags with a single $text query.
// Without an index, every search would scan the entire collection (slow!).
PostSchema.index({ title: "text", description: "text", tags: "text" });

// Index by type and createdAt for filtered listing queries
PostSchema.index({ type: 1, createdAt: -1 });

// ── VIRTUAL: Comment count ─────────────────────────────────────
PostSchema.virtual("commentCount").get(function () {
  return this.comments ? this.comments.length : 0;
});

PostSchema.virtual("interestCount").get(function () {
  return this.interestedUsers ? this.interestedUsers.length : 0;
});

module.exports = mongoose.model("Post", PostSchema);
