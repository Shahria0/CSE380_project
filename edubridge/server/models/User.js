// ============================================================
// server/models/User.js — User Data Model
// ============================================================
// WHAT THIS DOES: Defines the "shape" of a user in our database.
// Mongoose uses this Schema to validate and structure data before
// saving it to MongoDB.
//
// BEGINNER NOTE: A "Schema" is like a blueprint — it tells MongoDB
// exactly what fields a user document can have and their types.
// ============================================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // For hashing passwords securely

const UserSchema = new mongoose.Schema(
  {
    // ── BASIC INFO ─────────────────────────────────────────
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true, // Removes leading/trailing whitespace
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // No two users can share the same email
      lowercase: true, // Always stored as lowercase
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      // SECURITY NOTE: select: false means this field is NOT
      // returned by default in queries — you must explicitly ask
      // for it with .select('+password'). This prevents accidental
      // password exposure in API responses.
      select: false,
    },

    // ── ROLE ──────────────────────────────────────────────
    // 'student' or 'alumni' — determines what they can do
    role: {
      type: String,
      enum: ["student", "alumni"],
      required: [true, "Role is required"],
      default: "student",
    },

    // ── STUDENT-SPECIFIC FIELDS ────────────────────────────
    department: { type: String, trim: true },
    level: {
      type: String,
      enum: ["Undergraduate", "Masters Student", "PhD Student", ""],
    },
    graduationYear: { type: String, trim: true },

    // ── ALUMNI-SPECIFIC FIELDS ─────────────────────────────
    alumniGradYear: { type: String, trim: true },
    alumniField: { type: String, trim: true },
    currentRole: { type: String, trim: true }, // e.g. "Software Engineer at Google"

    // ── PROFILE ────────────────────────────────────────────
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },
    skills: [{ type: String, trim: true }], // Array of skill strings
    interests: [{ type: String, trim: true }],
    avatar: { type: String, default: "" }, // URL to profile picture
    linkedIn: { type: String, default: "" },
    github: { type: String, default: "" },
    website: { type: String, default: "" },

    // ── PASSWORD RESET (OTP) ───────────────────────────────
    // SENIOR NOTE: We store a hashed OTP + expiry, never the plain OTP.
    // This way, even if the DB is compromised, OTPs can't be reused.
    resetOtp: { type: String, select: false },
    resetOtpExpiry: { type: Date, select: false },

    // ── NOTIFICATIONS PREFERENCES ─────────────────────────
    notifications: {
      emailOnComment: { type: Boolean, default: true },
      emailOnInterest: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
    },

    // ── SAVED POSTS ────────────────────────────────────────
    // Array of Post ObjectIds the user has bookmarked
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],

    // ── ACCOUNT STATUS ────────────────────────────────────
    isActive: { type: Boolean, default: true },
  },
  {
    // timestamps: true automatically adds createdAt and updatedAt fields
    // BEGINNER NOTE: These are maintained by Mongoose — you never set them manually
    timestamps: true,
  }
);

// ============================================================
// MIDDLEWARE: Hash password before saving
// ============================================================
// WHAT THIS DOES: Every time a user is saved (or password is changed),
// this hook runs BEFORE the save. It automatically hashes the password
// so we NEVER store plain-text passwords in the database.
//
// SENIOR NOTE: We check isModified('password') to avoid re-hashing
// on every save (e.g., if only the bio is updated).
// ============================================================
UserSchema.pre("save", async function (next) {
  // Only hash if the password field was actually changed
  if (!this.isModified("password")) return next();

  // bcrypt.genSalt(12) — the "12" is the salt rounds.
  // Higher = more secure but slower. 12 is a good balance for production.
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ============================================================
// INSTANCE METHOD: Compare plain password with stored hash
// ============================================================
// Usage: const isMatch = await user.comparePassword('userTypedPassword')
// BEGINNER NOTE: Instance methods are called on a specific user object,
// like user.comparePassword() — NOT on the model itself.
// ============================================================
UserSchema.methods.comparePassword = async function (candidatePassword) {
  // bcrypt.compare() returns true if the plain text matches the hash
  return await bcrypt.compare(candidatePassword, this.password);
};

// ============================================================
// VIRTUAL: Full name (computed, not stored in DB)
// ============================================================
// Virtuals are properties that exist on the model but are NOT
// saved to MongoDB. They're computed from other fields.
// ============================================================
UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Make virtuals show up in JSON output (e.g., API responses)
UserSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("User", UserSchema);
