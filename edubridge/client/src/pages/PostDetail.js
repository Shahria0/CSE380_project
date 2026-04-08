// ============================================================
// client/src/pages/PostDetail.js — Single Post View + Comments
// ============================================================
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { postsAPI } from "../api/client";
import { useAuth } from "../context/AuthContext";

const typeConfig = { project: { label: "Project Idea", cls: "badge-project" }, thesis: { label: "Thesis Topic", cls: "badge-thesis" }, experience: { label: "Experience", cls: "badge-experience" } };

const timeAgo = (d) => {
  const s = Math.floor((new Date() - new Date(d)) / 1000);
  const i = [{ l: "year", s: 31536000 }, { l: "month", s: 2592000 }, { l: "day", s: 86400 }, { l: "hour", s: 3600 }, { l: "minute", s: 60 }];
  for (const iv of i) { const c = Math.floor(s / iv.s); if (c >= 1) return `${c} ${iv.l}${c > 1 ? "s" : ""} ago`; }
  return "just now";
};

const PostDetail = () => {
  const { id } = useParams(); // Get post ID from URL: /posts/:id
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [interested, setInterested] = useState(false);
  const [interestCount, setInterestCount] = useState(0);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // Increment view count (fire and forget)
        postsAPI.incrementView(id).catch(() => {});
        const { data } = await postsAPI.getOne(id);
        setPost(data.post);
        setInterestCount(data.post.interestedUsers?.length || 0);
        // Check if current user is already interested
        if (user) {
          setInterested(data.post.interestedUsers?.some((uid) => uid === user._id || uid._id === user._id));
        }
      } catch {
        setError("Post not found or has been removed.");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, user]);

  // ── ADD COMMENT ──────────────────────────────────────────
  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommenting(true);
    try {
      const { data } = await postsAPI.addComment(id, commentText);
      // Append new comment to the existing list — no need to re-fetch
      setPost((prev) => ({ ...prev, comments: [...(prev.comments || []), data.comment] }));
      setCommentText("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post comment.");
    } finally {
      setCommenting(false);
    }
  };

  // ── TOGGLE INTEREST ──────────────────────────────────────
  const handleInterest = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    try {
      const { data } = await postsAPI.toggleInterest(id);
      setInterested(data.interested);
      setInterestCount(data.interestCount);
      if (data.interested) setShowInterestModal(true);
    } catch { /* silent fail */ }
  };

  // ── DELETE POST ──────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await postsAPI.delete(id);
      navigate("/dashboard", { state: { success: "Post deleted successfully." } });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete post.");
      setDeleting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error || !post) return <ErrorState message={error} />;

  const type = typeConfig[post.type] || typeConfig.project;
  const author = post.author || {};
  const isAuthor = user && (post.author?._id === user._id || post.author === user._id);

  return (
    <div className="page-content">
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 1.5rem 4rem" }}>
        <Link to="/listings" style={styles.backLink}>← Back to listings</Link>

        <div style={styles.layout}>
          {/* ── MAIN CONTENT ── */}
          <article style={styles.mainCard}>
            {/* Post header */}
            <div style={styles.postTop}>
              <span className={`badge ${type.cls}`}>{type.label}</span>
              {post.status === "open" && <span className="badge badge-open">Open</span>}
              <span style={styles.time}>{timeAgo(post.createdAt)}</span>
            </div>
            <h1 style={styles.title}>{post.title}</h1>

            {/* Author info */}
            <Link to={`/profile/${author._id}`} className="hover-bright" style={styles.authorRow}>
              <div style={styles.authorAvatar}>{author.firstName?.[0]}{author.lastName?.[0]}</div>
              <div>
                <div style={styles.authorName}>{author.firstName} {author.lastName}</div>
                <div style={styles.authorRole}>{author.role === "alumni" ? `Alumni · ${author.alumniField || ""}` : `Student · ${author.department || ""}`}</div>
              </div>
              <span style={styles.viewProfile}>View Profile →</span>
            </Link>

            {/* Description */}
            <h3 style={styles.sectionTitle}>Overview</h3>
            <p style={styles.sectionBody}>{post.description}</p>

            {/* Details */}
            {post.details && (
              <>
                <div className="divider" />
                <h3 style={styles.sectionTitle}>Details</h3>
                <p style={styles.sectionBody}>{post.details}</p>
              </>
            )}

            {/* Tags */}
            {post.tags?.length > 0 && (
              <>
                <div className="divider" />
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {post.tags.map((tag) => <span key={tag} className="tag tag-animated">{tag}</span>)}
                </div>
              </>
            )}

            {/* Info grid */}
            <div className="divider" />
            <div style={styles.infoGrid}>
              {post.department && <InfoItem label="Department" value={post.department} />}
              {post.lookingFor && <InfoItem label="Looking For" value={post.lookingFor} />}
              {post.deadline && <InfoItem label="Deadline" value={new Date(post.deadline).toLocaleDateString()} />}
              <InfoItem label="Status" value={post.status.charAt(0).toUpperCase() + post.status.slice(1)} />
            </div>

            {/* Author controls */}
            {isAuthor && (
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--bg-light)" }}>
                <Link to={`/edit-post/${post._id}`}>
                  <button className="btn btn-secondary btn-sm">✏️ Edit Post</button>
                </Link>
                <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "🗑️ Delete"}
                </button>
              </div>
            )}

            {/* ── COMMENTS ── */}
            <div style={{ marginTop: "2rem" }}>
              <h3 style={styles.sectionTitle}>💬 Comments ({post.comments?.length || 0})</h3>

              {/* Comment form */}
              {isLoggedIn ? (
                <form onSubmit={handleComment} style={styles.commentForm}>
                  <textarea
                    className="form-textarea"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts, ask a question, or offer to collaborate..."
                    style={{ minHeight: 80, marginBottom: "0.75rem" }}
                    maxLength={1000}
                  />
                  <button className="btn btn-primary btn-sm btn-animated" type="submit" disabled={commenting || !commentText.trim()}>
                    {commenting && <span className="spinner" />} Post Comment
                  </button>
                </form>
              ) : (
                <div style={styles.loginPrompt}>
                  <Link to="/login" style={{ color: "var(--brand)", fontWeight: 600 }}>Sign in</Link> to leave a comment
                </div>
              )}

              {/* Comments list */}
              <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {post.comments?.length === 0 && (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No comments yet. Be the first!</p>
                )}
                {post.comments?.map((c) => (
                  <div key={c._id} style={styles.commentCard}>
                    <div style={styles.commentHeader}>
                      <div style={styles.commentAvatar}>{c.author?.firstName?.[0]}{c.author?.lastName?.[0]}</div>
                      <div>
                        <span style={styles.commentName}>{c.author?.firstName} {c.author?.lastName}</span>
                        <span style={styles.commentTime}> · {timeAgo(c.createdAt)}</span>
                      </div>
                    </div>
                    <p style={styles.commentText}>{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* ── SIDEBAR ── */}
          <aside style={styles.sidebar}>
            {/* Apply / Interest card */}
            <div className="hover-lift" style={styles.applyCard}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                {post.type === "experience" ? "Found this helpful?" : "Interested in collaborating?"}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.5 }}>
                {post.type === "experience" ? "Express your appreciation and connect with the author." : "Let the author know you're interested in working together."}
              </p>
              <button
                className={`btn btn-full btn-lg btn-animated ${interested ? "btn-secondary" : "btn-primary"}`}
                onClick={handleInterest}
                style={{ marginBottom: "0.6rem" }}
              >
                {interested ? "✓ Interested" : "Express Interest"}
              </button>
              <p style={{ textAlign: "center", fontSize: "0.82rem", color: "var(--text-faint)" }}>
                {interestCount} {interestCount === 1 ? "person" : "people"} interested
              </p>
            </div>

            {/* Stats card */}
            <div className="hover-lift" style={styles.statsCard}>
              <h4 style={styles.statsTitle}>Post Stats</h4>
              <StatRow label="Views" value={post.views || 0} />
              <StatRow label="Comments" value={post.comments?.length || 0} />
              <StatRow label="Interested" value={interestCount} />
              <StatRow label="Posted" value={new Date(post.createdAt).toLocaleDateString()} />
            </div>
          </aside>
        </div>
      </div>

      {/* Interest success modal */}
      {showInterestModal && (
        <div className="modal-overlay" onClick={() => setShowInterestModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎉</div>
              <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Interest Expressed!</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>The author has been notified of your interest. They may reach out to you soon.</p>
              <button className="btn btn-primary" onClick={() => setShowInterestModal(false)}>Got it!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── HELPER COMPONENTS ──────────────────────────────────────────
const InfoItem = ({ label, value }) => (
  <div style={{ background: "var(--bg)", borderRadius: "var(--radius-sm)", padding: "0.7rem 0.9rem" }}>
    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>{label}</div>
    <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>{value}</div>
  </div>
);

const StatRow = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid var(--bg-light)", fontSize: "0.85rem" }}>
    <span style={{ color: "var(--text-muted)" }}>{label}</span>
    <strong>{value}</strong>
  </div>
);

const LoadingState = () => (
  <div className="page-content">
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div style={{ height: 400, background: "var(--bg-light)", borderRadius: "var(--radius-xl)", animation: "shimmer 1.5s infinite" }} />
    </div>
  </div>
);

const ErrorState = ({ message }) => (
  <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😕</div>
      <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Post not found</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>{message || "This post may have been removed."}</p>
      <Link to="/listings"><button className="btn btn-primary">Browse All Posts</button></Link>
    </div>
  </div>
);

const styles = {
  backLink: { display: "inline-block", fontSize: "0.88rem", color: "var(--text-muted)", marginTop: "1.5rem", marginBottom: "1.25rem" },
  layout: { display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", alignItems: "start" },
  mainCard: { background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "2rem" },
  postTop: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" },
  time: { fontSize: "0.82rem", color: "var(--text-faint)", marginLeft: "auto" },
  title: { fontSize: "1.45rem", fontWeight: 700, lineHeight: 1.3, marginBottom: "1rem" },
  authorRow: { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.9rem", background: "var(--bg)", borderRadius: "var(--radius)", marginBottom: "1.5rem", border: "1px solid var(--border)" },
  authorAvatar: { width: 40, height: 40, borderRadius: "50%", background: "var(--brand-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 700, color: "var(--brand)", flexShrink: 0 },
  authorName: { fontSize: "0.93rem", fontWeight: 700 },
  authorRole: { fontSize: "0.8rem", color: "var(--text-muted)" },
  viewProfile: { marginLeft: "auto", fontSize: "0.8rem", color: "var(--brand)", fontWeight: 600 },
  sectionTitle: { fontSize: "1rem", fontWeight: 700, marginBottom: "0.65rem" },
  sectionBody: { fontSize: "0.93rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1.5rem", whiteSpace: "pre-wrap" },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" },
  commentForm: { marginTop: "1rem" },
  loginPrompt: { background: "var(--bg-light)", borderRadius: "var(--radius)", padding: "1rem", textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "1rem" },
  commentCard: { background: "var(--bg)", borderRadius: "var(--radius)", padding: "1rem" },
  commentHeader: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" },
  commentAvatar: { width: 32, height: 32, borderRadius: "50%", background: "var(--brand-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 700, color: "var(--brand)", flexShrink: 0 },
  commentName: { fontSize: "0.88rem", fontWeight: 700 },
  commentTime: { fontSize: "0.78rem", color: "var(--text-faint)" },
  commentText: { fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 },
  sidebar: { display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "76px" },
  applyCard: { background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "1.5rem" },
  statsCard: { background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "1.25rem" },
  statsTitle: { fontSize: "0.88rem", fontWeight: 700, marginBottom: "0.75rem" },
};

export default PostDetail;
