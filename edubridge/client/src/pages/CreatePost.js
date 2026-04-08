// ============================================================
// client/src/pages/CreatePost.js — Create New Post
// ============================================================
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { postsAPI } from "../api/client";

const DEPARTMENTS = ["Computer Science","Electrical Engineering","Electronics & Telecom Engineering","Civil Engineering","Business Administration","Psychology","Biomedical Engineering","Environmental Science","Mathematics","Physics","Other"];

const TYPE_CONFIG = {
  project:    { label: "Project Idea",   icon: "💡", desc: "Share an innovative project concept and find collaborators" },
  thesis:     { label: "Thesis Topic",   icon: "📚", desc: "Propose a research topic or seek academic guidance" },
  experience: { label: "Experience",     icon: "🌟", desc: "Share your academic journey and lessons learned" },
};

const TIPS = {
  project:    ["Describe the problem you're solving", "Mention required skills or technologies", "Specify if you're looking for team members", "Include expected timeline or deliverables"],
  thesis:     ["State your research question clearly", "Mention the methodology you plan to use", "Indicate if you need a supervisor or collaborators", "Include your target completion date"],
  experience: ["Share specific challenges and how you overcame them", "Mention resources that helped you succeed", "Include advice you wish you had received", "Be authentic — real stories resonate most"],
};

const CreatePost = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ type: "project", title: "", description: "", details: "", tags: "", department: "", lookingFor: "", deadline: "", status: "open" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleTypeSelect = (type) => {
    setForm((prev) => ({ ...prev, type }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.description.trim()) { setError("Description is required."); return; }

    setLoading(true);
    setError("");
    try {
      const { data } = await postsAPI.create(form);
      // Redirect to the new post's detail page
      navigate(`/posts/${data.post._id}`, { state: { success: "Post created successfully!" } });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Parse tags for preview display
  const tagList = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div className="page-content">
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "0 1.5rem 4rem" }}>
        {/* ── BACK + HEADER ── */}
        <Link to="/dashboard" style={styles.backLink}>← Back to Dashboard</Link>
        <div style={styles.pageIntro}>
          <h1 style={styles.h1}>Create a Post</h1>
          <p style={styles.sub}>Share your ideas with the EduBridge community</p>
        </div>

        <div style={styles.formCard}>
          {error && <div className="alert alert-error alert-animated"><ErrIcon />{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* ── POST TYPE SELECTOR ── */}
            <p style={styles.typeLabel}>Post Type <span style={{ color: "var(--danger)" }}>*</span></p>
            <div style={styles.typeGrid}>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <div
                  key={key}
                  className="hover-lift" style={{ ...styles.typeCard, ...(form.type === key ? styles.typeCardSelected : {}) }}
                  onClick={() => handleTypeSelect(key)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleTypeSelect(key)}
                >
                  <div style={{ fontSize: "1.5rem" }}>{cfg.icon}</div>
                  <div style={{ ...styles.typeCardTitle, ...(form.type === key ? { color: "var(--brand)" } : {}) }}>{cfg.label}</div>
                  <div style={styles.typeCardSub}>{cfg.desc}</div>
                </div>
              ))}
            </div>

            {/* ── TIPS BOX ── */}
            <div style={styles.tipsBox}>
              <h4 style={styles.tipsTitle}>✨ Tips for a great {TYPE_CONFIG[form.type].label}</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {TIPS[form.type].map((tip) => (
                  <li key={tip} style={{ fontSize: "0.85rem", color: "#1e40af", display: "flex", gap: "0.4rem" }}>
                    <span style={{ color: "var(--brand)", fontWeight: 700 }}>•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* ── MAIN FIELDS ── */}
            <div className="form-group">
              <label className="form-label">Title <span className="req">*</span></label>
              <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder={`Enter a clear, descriptive title for your ${TYPE_CONFIG[form.type].label.toLowerCase()}`} maxLength={200} required />
              <p className="form-hint">{form.title.length}/200 characters</p>
            </div>

            <div className="form-group">
              <label className="form-label">Description <span className="req">*</span></label>
              <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} placeholder="Provide a clear overview. What is this about? What are you looking for?" style={{ minHeight: 140 }} maxLength={2000} required />
              <p className="form-hint">{form.description.length}/2000 characters</p>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Details</label>
              <textarea className="form-textarea" name="details" value={form.details} onChange={handleChange} placeholder="Methodology, requirements, background, links, etc." style={{ minHeight: 100 }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-select" name="department" value={form.department} onChange={handleChange}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                  <option value="open">Open (looking for collaborators)</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {form.type !== "experience" && (
              <>
                <div className="form-group">
                  <label className="form-label">Looking For</label>
                  <input className="form-input" name="lookingFor" value={form.lookingFor} onChange={handleChange} placeholder="e.g. Frontend developer, Data scientist, Research partner..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline / Target Date</label>
                  <input className="form-input" type="date" name="deadline" value={form.deadline} onChange={handleChange} />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Tags</label>
              <input className="form-input" name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. machine-learning, python, research (comma-separated)" />
              {tagList.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
                  {tagList.map((tag) => (
                    <span key={tag} style={styles.tagChip}>{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* ── SUBMIT ── */}
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "0.5rem" }}>
              <button className="btn btn-primary btn-lg btn-animated" type="submit" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? "Publishing..." : "Publish Post"}
              </button>
              <Link to="/dashboard">
                <button className="btn btn-secondary btn-lg" type="button">Cancel</button>
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

const styles = {
  backLink: { display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.88rem", color: "var(--text-muted)", marginTop: "1.5rem", marginBottom: "1rem", display: "block" },
  pageIntro: { paddingBottom: "0.5rem" },
  h1: { fontSize: "1.6rem", fontWeight: 700 },
  sub: { fontSize: "0.93rem", color: "var(--text-muted)", marginTop: "0.25rem" },
  formCard: { background: "#fff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", padding: "2rem", marginTop: "1.5rem", boxShadow: "var(--shadow-sm)" },
  typeLabel: { fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.6rem" },
  typeGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" },
  typeCard: { border: "1.5px solid var(--border)", borderRadius: "var(--radius)", padding: "0.85rem", cursor: "pointer", transition: "border-color 0.2s, background 0.2s", display: "flex", flexDirection: "column", gap: "0.2rem" },
  typeCardSelected: { borderColor: "var(--brand)", background: "var(--brand-light)" },
  typeCardTitle: { fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" },
  typeCardSub: { fontSize: "0.75rem", color: "var(--text-faint)", lineHeight: 1.4 },
  tipsBox: { background: "var(--brand-light)", borderRadius: "var(--radius)", padding: "1rem 1.1rem", marginBottom: "1.5rem", border: "1px solid var(--brand-100)" },
  tipsTitle: { fontSize: "0.9rem", fontWeight: 700, color: "var(--brand)", marginBottom: "0.5rem" },
  tagChip: { fontSize: "0.78rem", color: "var(--brand)", background: "var(--brand-100)", borderRadius: 20, padding: "0.15rem 0.65rem" },
};

const ErrIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17" style={{ flexShrink: 0, marginRight: 4 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

export default CreatePost;
