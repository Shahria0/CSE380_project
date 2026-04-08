// ============================================================
// client/src/pages/EditPost.js
// ============================================================
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { postsAPI } from "../api/client";
import { useAuth } from "../context/AuthContext";

const DEPARTMENTS = ["Computer Science","Electrical Engineering","Electronics & Telecom Engineering","Civil Engineering","Business Administration","Psychology","Biomedical Engineering","Environmental Science","Mathematics","Physics","Other"];

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ title: "", description: "", details: "", tags: "", department: "", lookingFor: "", deadline: "", status: "open", type: "project" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await postsAPI.getOne(id);
        const p = data.post;
        // Authorization: only author can edit
        if (p.author._id !== user?._id && p.author !== user?._id) {
          navigate("/dashboard");
          return;
        }
        setForm({
          title: p.title || "",
          description: p.description || "",
          details: p.details || "",
          tags: (p.tags || []).join(", "),
          department: p.department || "",
          lookingFor: p.lookingFor || "",
          deadline: p.deadline ? new Date(p.deadline).toISOString().split("T")[0] : "",
          status: p.status || "open",
          type: p.type || "project",
        });
      } catch {
        setError("Post not found.");
      } finally { setLoading(false); }
    };
    load();
  }, [id, user, navigate]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await postsAPI.update(id, form);
      navigate(`/posts/${id}`, { state: { success: "Post updated!" } });
    } catch (err) {
      setError(err.response?.data?.message || "Update failed.");
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}>Loading...</div>;

  return (
    <div className="page-content">
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "0 1.5rem 4rem" }}>
        <Link to={`/posts/${id}`} style={{ display: "block", fontSize: "0.88rem", color: "var(--text-muted)", marginTop: "1.5rem", marginBottom: "1rem" }}>← Back to Post</Link>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "1.5rem" }}>Edit Post</h1>

        <div style={{ background: "#fff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", padding: "2rem", boxShadow: "var(--shadow-sm)" }}>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title <span className="req">*</span></label>
              <input className="form-input" name="title" value={form.title} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description <span className="req">*</span></label>
              <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} style={{ minHeight: 140 }} required />
            </div>
            <div className="form-group">
              <label className="form-label">Additional Details</label>
              <textarea className="form-textarea" name="details" value={form.details} onChange={handleChange} style={{ minHeight: 100 }} />
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
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            {form.type !== "experience" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Looking For</label>
                  <input className="form-input" name="lookingFor" value={form.lookingFor} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input className="form-input" type="date" name="deadline" value={form.deadline} onChange={handleChange} />
                </div>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input className="form-input" name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. python, AI, research" />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn btn-primary btn-lg" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
              <Link to={`/posts/${id}`}><button className="btn btn-secondary btn-lg" type="button">Cancel</button></Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditPost;
