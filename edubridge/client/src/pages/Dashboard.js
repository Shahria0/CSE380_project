// ============================================================
// client/src/pages/Dashboard.js — Main Feed
// ============================================================
// Fetches posts from the API and displays them in sections.
// Uses useEffect + useState to manage async data loading.
// ============================================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { postsAPI } from "../api/client";
import PostCard from "../components/PostCard";
import Footer from "../components/Footer";

const Dashboard = () => {
  const { user } = useAuth();
  const [sections, setSections] = useState({ project: [], thesis: [], experience: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Fetch all 3 post types in parallel for speed
        const [projects, theses, experiences] = await Promise.all([
          postsAPI.getAll({ type: "project", limit: 3 }),
          postsAPI.getAll({ type: "thesis", limit: 3 }),
          postsAPI.getAll({ type: "experience", limit: 3 }),
        ]);
        setSections({
          project: projects.data.posts,
          thesis: theses.data.posts,
          experience: experiences.data.posts,
        });
      } catch {
        setError("Failed to load posts. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <div className="page-content">
        <div className="container" style={{ paddingBottom: "4rem" }}>
          {/* ── PAGE HEADER ── */}
          <div style={styles.pageHeader}>
            <div>
              <h1 style={styles.h1}>{greeting}, {user?.firstName}! 👋</h1>
              <p style={styles.sub}>Discover projects, research topics and alumni stories.</p>
            </div>
            <Link to="/create-post" className="hide-mobile">
              <button className="btn btn-primary btn-animated"><PlusIcon /> Create Post</button>
            </Link>
          </div>

          {/* ── QUICK STATS ── */}
          <div style={styles.statsGrid}>
            <StatCard icon="🎓" label="Your Role" value={user?.role === "alumni" ? "Alumni" : "Student"} color="var(--brand-light)" />
            <StatCard icon="🏛️" label="Department" value={user?.department || user?.alumniField || "—"} color="#F0FDF4" />
            <StatCard icon="📅" label={user?.role === "alumni" ? "Graduated" : "Expected"} value={user?.alumniGradYear || user?.graduationYear || "—"} color="#FEF3C7" />
            <Link to="/create-post" style={{ textDecoration: "none" }}>
              <StatCard icon="✍️" label="Share Knowledge" value="Create a Post" color="var(--brand-light)" clickable />
            </Link>
          </div>

          {error && <div className="alert alert-error" style={{ margin: "1rem 0" }}>{error}</div>}

          {/* ── SECTIONS ── */}
          {loading ? (
            <SkeletonSection />
          ) : (
            <>
              <PostSection title="🚀 Project Ideas" sub="Innovative project concepts looking for collaborators" type="project" posts={sections.project} linkTo="/listings?type=project" />
              <PostSection title="📚 Research & Thesis" sub="Topics open for research collaboration" type="thesis" posts={sections.thesis} linkTo="/listings?type=thesis" />
              <PostSection title="🌟 Alumni Experiences" sub="Learn from those who've been there" type="experience" posts={sections.experience} linkTo="/alumni" />
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

// ── SECTION COMPONENT ──────────────────────────────────────────
const PostSection = ({ title, sub, posts, linkTo }) => (
  <section className="section-animated" style={styles.section}>
    <div style={styles.sectionHeader}>
      <div>
        <h2 style={styles.sectionTitle}>{title}</h2>
        <p style={styles.sectionSub}>{sub}</p>
      </div>
      <Link to={linkTo}>
        <button className="btn btn-ghost btn-sm btn-secondary-animated">View All →</button>
      </Link>
    </div>
    {posts.length === 0 ? (
      <div style={styles.emptyState}>
        <p>No posts yet. <Link to="/create-post" style={{ color: "var(--brand)" }}>Be the first to share!</Link></p>
      </div>
    ) : (
      <div className="grid-stagger" style={styles.grid}>
        {posts.map((post) => <PostCard key={post._id} post={post} />)}
      </div>
    )}
  </section>
);

// ── STAT CARD ─────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, clickable }) => (
  <div className="stat-card-animated" style={{ ...styles.statCard, background: color, cursor: clickable ? "pointer" : "default" }}>
    <div style={styles.statIcon}>{icon}</div>
    <div style={styles.statLabel}>{label}</div>
    <div style={styles.statValue}>{value}</div>
  </div>
);

// ── SKELETON LOADING ───────────────────────────────────────────
const SkeletonSection = () => (
  <div>
    {[1, 2, 3].map((i) => (
      <section key={i} style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={{ ...styles.skeleton, width: 200, height: 24 }} />
          <div style={{ ...styles.skeleton, width: 80, height: 32 }} />
        </div>
        <div className="grid-stagger" style={styles.grid}>
          {[1, 2, 3].map((j) => (
            <div key={j} style={{ ...styles.skeleton, height: 200, borderRadius: "var(--radius-md)" }} />
          ))}
        </div>
      </section>
    ))}
  </div>
);

const styles = {
  pageHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2rem 0 1.25rem", flexWrap: "wrap", gap: "1rem" },
  h1: { fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" },
  sub: { fontSize: "0.95rem", color: "var(--text-muted)" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2.5rem" },
  statCard: { borderRadius: "var(--radius-lg)", padding: "1.25rem", border: "1px solid var(--border)", transition: "box-shadow 0.2s" },
  statIcon: { fontSize: "1.5rem", marginBottom: "0.5rem" },
  statLabel: { fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.2rem" },
  statValue: { fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" },
  section: { marginBottom: "2.75rem" },
  sectionHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" },
  sectionTitle: { fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" },
  sectionSub: { fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.1rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" },
  emptyState: { background: "var(--bg-light)", borderRadius: "var(--radius-md)", padding: "2rem", textAlign: "center", color: "var(--text-muted)" },
  skeleton: { background: "linear-gradient(90deg, var(--bg-light) 25%, #e8edf3 50%, var(--bg-light) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" },
};

// Add responsive styles via media query in CSS — inline styles can't do this,
// so we use a style tag for grid responsiveness
const ResponsiveStyle = () => (
  <style>{`
    @media (max-width: 900px) { .dash-grid { grid-template-columns: 1fr 1fr !important; } }
    @media (max-width: 600px) { .dash-grid { grid-template-columns: 1fr !important; } .stats-grid { grid-template-columns: 1fr 1fr !important; } }
  `}</style>
);

const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

export default Dashboard;
