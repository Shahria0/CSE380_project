// ============================================================
// client/src/components/PostCard.js — Reusable Post Card
// ============================================================
// ANIMATION ADDITIONS:
//   - .post-card-animated   → lift + border glow on hover
//   - .badge-animated       → badge scales on hover
//   - .tag-animated         → tags lift + turn blue on hover
//   - .avatar-animated      → author avatar pops on hover
//   - .btn-secondary-animated → view button border animates
//   - .card-title-hover     → title turns brand color (triggered by card hover via CSS)
// ============================================================

import React from "react";
import { Link } from "react-router-dom";

const timeAgo = (dateString) => {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
};

const typeConfig = {
  project:    { label: "Project Idea",  badgeClass: "badge-project" },
  thesis:     { label: "Thesis Topic",  badgeClass: "badge-thesis" },
  experience: { label: "Experience",    badgeClass: "badge-experience" },
};

const authorColor = (id) => {
  const colors = ["#DBEAFE", "#EDE9FE", "#DCFCE7", "#FEF3C7", "#FCE7F3"];
  if (!id) return colors[0];
  return colors[parseInt(id.slice(-1), 16) % colors.length];
};

const PostCard = ({ post, compact = false }) => {
  if (!post) return null;
  const type = typeConfig[post.type] || typeConfig.project;
  const author = post.author || {};
  const authorName = `${author.firstName || ""} ${author.lastName || ""}`.trim();

  return (
    <article
      // post-card-animated applies lift + border glow on hover
      // The CSS in animations.css also targets .card-title-hover inside this element
      className="post-card-animated"
      style={styles.card}
    >
      {/* ── HEADER ROW ── */}
      <div style={styles.metaRow}>
        {/* badge-animated makes the badge scale slightly on hover */}
        <span className={`badge ${type.badgeClass} badge-animated`}>{type.label}</span>
        <span style={styles.timeAgo}>{timeAgo(post.createdAt)}</span>
      </div>

      {/* ── TITLE — card-title-hover lets parent CSS change color on card hover ── */}
      <h3 style={styles.title} className="card-title-hover">{post.title}</h3>

      {!compact && (
        <p style={styles.desc}>{post.description}</p>
      )}

      {/* ── TAGS — tag-animated adds hover lift + color change ── */}
      {post.tags?.length > 0 && (
        <div style={styles.tagsRow}>
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag tag-animated">{tag}</span>
          ))}
          {post.tags.length > 3 && (
            <span className="tag">+{post.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* ── FOOTER ── */}
      <div style={styles.footer}>
        <div style={styles.author}>
          {/* avatar-animated pops on hover */}
          <div
            className="avatar-animated"
            style={{ ...styles.authorAvatar, background: authorColor(author._id) }}
          >
            {author.firstName?.[0]}{author.lastName?.[0]}
          </div>
          <div>
            <div style={styles.authorName}>{authorName || "Unknown"}</div>
            <div style={styles.authorRole}>
              {author.role === "alumni"
                ? `Alumni · ${author.alumniField || ""}`
                : `Student · ${author.department || ""}`}
            </div>
          </div>
        </div>

        {/* btn-secondary-animated: border + color shift on hover */}
        <Link to={`/posts/${post._id}`}>
          <button className="btn-secondary-animated" style={styles.viewBtn}>View →</button>
        </Link>
      </div>

      {/* ── STATS ROW ── */}
      {!compact && (
        <div style={styles.statsRow}>
          <span style={styles.stat}><EyeIcon /> {post.views || 0}</span>
          <span style={styles.stat}><CommentIcon /> {post.commentCount || 0}</span>
          <span style={styles.stat}><HeartIcon /> {post.interestCount || 0}</span>
          {post.status === "open" && (
            <span className="badge badge-open" style={{ marginLeft: "auto" }}>Open</span>
          )}
        </div>
      )}
    </article>
  );
};

const styles = {
  card: {
    background: "var(--bg-white)",
    border: "1.5px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "1.1rem 1.15rem",
    display: "flex", flexDirection: "column", gap: "0.6rem",
    // Note: transitions are handled by .post-card-animated in animations.css
  },
  metaRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  timeAgo: { fontSize: "0.78rem", color: "var(--text-faint)" },
  title: {
    fontSize: "0.97rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.35,
    // Transition for color change on card hover (triggered by .post-card-animated:hover .card-title-hover)
    transition: "color 0.18s ease",
  },
  desc: {
    fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.55,
    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
  },
  tagsRow: { display: "flex", flexWrap: "wrap", gap: "0.35rem" },
  footer: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.25rem" },
  author: { display: "flex", alignItems: "center", gap: "0.45rem" },
  authorAvatar: {
    width: 28, height: 28, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.72rem", fontWeight: 700, color: "var(--brand)",
    border: "1px solid var(--border)",
  },
  authorName: { fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" },
  authorRole: { fontSize: "0.72rem", color: "var(--text-faint)" },
  viewBtn: {
    fontSize: "0.8rem", fontWeight: 600, color: "var(--brand)",
    border: "1.5px solid var(--brand-100)", borderRadius: "var(--radius-sm)",
    padding: "0.3rem 0.7rem", background: "#fff", cursor: "pointer", whiteSpace: "nowrap",
  },
  statsRow: {
    display: "flex", alignItems: "center", gap: "0.75rem",
    paddingTop: "0.5rem", borderTop: "1px solid var(--bg-light)",
  },
  stat: { display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", color: "var(--text-faint)" },
};

const EyeIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const CommentIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const HeartIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;

export default PostCard;
