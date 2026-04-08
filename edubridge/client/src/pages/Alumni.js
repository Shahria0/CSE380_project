// ============================================================
// client/src/pages/Alumni.js — Alumni Experience Sharing
// ============================================================
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { postsAPI } from "../api/client";
import PostCard from "../components/PostCard";
import Footer from "../components/Footer";

const Alumni = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await postsAPI.getAll({ type: "experience", limit: 12 });
        setPosts(data.posts);
      } catch { /* silent fail */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = posts.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* ── HERO BANNER ── */}
      <div style={styles.hero}>
        <div style={styles.heroBadge}>🎓 Alumni & Student Experiences</div>
        <h1 style={styles.heroH1}>Learn From Those Who've Been There</h1>
        <p style={styles.heroP}>Real stories from students and alumni who navigated the challenges of academic life. Their experiences can guide your journey.</p>
        <Link to="/create-post?type=experience">
          <button style={styles.heroBtn}>Share Your Experience</button>
        </Link>
      </div>

      {/* ── STATS BAR ── */}
      <div style={styles.statsBar}>
        <StatItem num={posts.length + "+"} label="Experiences Shared" />
        <StatItem num="150+" label="Alumni Contributors" />
        <StatItem num="20+" label="Departments" />
        <StatItem num="500+" label="Students Helped" />
      </div>

      {/* ── CONTENT ── */}
      <div className="page-content" style={{ paddingTop: 0 }}>
        <div className="container" style={{ paddingBottom: "4rem", paddingTop: "2rem" }}>
          {/* Search */}
          <div style={styles.searchRow}>
            <div style={styles.searchWrap}>
              <SearchIcon />
              <input
                style={styles.searchInput}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search experiences, topics, industries..."
              />
            </div>
            <Link to="/create-post?type=experience">
              <button className="btn btn-primary btn-animated">+ Share Experience</button>
            </Link>
          </div>

          {/* Posts Grid */}
          {loading ? (
            <div className="grid-stagger" style={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 220, background: "var(--bg-light)", borderRadius: "var(--radius-md)", animation: "shimmer 1.5s infinite" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌟</div>
              <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
                {search ? "No matching experiences" : "No experiences yet"}
              </h3>
              <p>{search ? "Try different search terms." : "Be the first alumni to share your story!"}</p>
              <Link to="/create-post?type=experience">
                <button className="btn btn-primary" style={{ marginTop: "1.5rem" }}>Share Your Experience</button>
              </Link>
            </div>
          ) : (
            <div className="grid-stagger" style={styles.grid}>
              {filtered.map((post) => <PostCard key={post._id} post={post} />)}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

const StatItem = ({ num, label }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand)" }}>{num}</div>
    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{label}</div>
  </div>
);

const styles = {
  hero: { background: "linear-gradient(135deg, #1e3a8a 0%, #155DFC 60%, #3b82f6 100%)", padding: "3.5rem 2rem 3rem", textAlign: "center", marginTop: "var(--nav-height)" },
  heroBadge: { display: "inline-block", background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 20, padding: "0.3rem 0.9rem", fontSize: "0.82rem", fontWeight: 600, marginBottom: "1rem", border: "1px solid rgba(255,255,255,0.25)" },
  heroH1: { fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: "0.6rem" },
  heroP: { fontSize: "1rem", color: "rgba(255,255,255,0.85)", maxWidth: 560, margin: "0 auto 1.5rem", lineHeight: 1.6 },
  heroBtn: { background: "#fff", color: "var(--brand)", border: "none", borderRadius: 10, padding: "0.75rem 1.75rem", fontFamily: "var(--font-base)", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" },
  statsBar: { background: "#fff", borderBottom: "1px solid var(--border)", padding: "1rem 2rem", display: "flex", justifyContent: "center", gap: "3rem", flexWrap: "wrap" },
  searchRow: { display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap" },
  searchWrap: { flex: 1, minWidth: 220, position: "relative", display: "flex", alignItems: "center" },
  searchInput: { width: "100%", padding: "0.6rem 0.9rem 0.6rem 2.25rem", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", fontFamily: "var(--font-base)", fontSize: "0.9rem", outline: "none", background: "var(--bg-white)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" },
};

const SearchIcon = () => <svg style={{ position: "absolute", left: "0.75rem", width: 16, height: 16, stroke: "var(--text-faint)" }} viewBox="0 0 24 24" fill="none" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;

export default Alumni;
