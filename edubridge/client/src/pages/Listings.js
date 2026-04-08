// ============================================================
// client/src/pages/Listings.js — Browse All Posts
// ============================================================
// Features: search, type filter, department filter, pagination
// Uses URLSearchParams to keep filter state in the URL
// (so users can share/bookmark filtered views)
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { postsAPI } from "../api/client";
import PostCard from "../components/PostCard";
import Footer from "../components/Footer";

const DEPARTMENTS = ["All Departments","Computer Science","Electrical Engineering","Business Administration","Psychology","Biomedical Engineering","Environmental Science","Mathematics","Physics","Other"];

const Listings = () => {
  // useSearchParams lets us read/write URL query params
  // e.g. /listings?type=project&search=AI&page=2
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params (enables shareable/bookmarkable URLs)
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [type, setType] = useState(searchParams.get("type") || "all");
  const [department, setDepartment] = useState(searchParams.get("department") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));

  // ── FETCH POSTS ────────────────────────────────────────────
  // useCallback prevents this function from being recreated on every render
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (type !== "all") params.type = type;
      if (search.trim()) params.search = search.trim();
      if (department && department !== "All Departments") params.department = department;

      const { data } = await postsAPI.getAll(params);
      setPosts(data.posts);
      setPagination(data.pagination);

      // Update URL to reflect current filters
      const newParams = {};
      if (type !== "all") newParams.type = type;
      if (search.trim()) newParams.search = search.trim();
      if (department && department !== "All Departments") newParams.department = department;
      if (page > 1) newParams.page = page;
      setSearchParams(newParams, { replace: true });
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [type, search, department, page, setSearchParams]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Reset to page 1 when filters change
  const handleTypeChange = (newType) => { setType(newType); setPage(1); };
  const handleDepartmentChange = (e) => { setDepartment(e.target.value); setPage(1); };

  // Search with debounce — wait 400ms after user stops typing
  // SENIOR NOTE: Debouncing prevents an API call on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchPosts(); }, 400);
    return () => clearTimeout(timer); // Cleanup cancels the timer if user types again
    // eslint-disable-next-line
  }, [search]);

  const typeLabels = { all: "All Posts", project: "Project Ideas", thesis: "Research & Thesis", experience: "Experiences" };

  return (
    <>
      <div className="page-content">
        <div className="container" style={{ paddingBottom: "4rem" }}>
          {/* ── HEADER ── */}
          <div style={styles.pageHeader}>
            <div>
              <h1 style={styles.h1}>Browse Posts</h1>
              <p style={styles.sub}>Discover projects, research topics and alumni experiences</p>
            </div>
            <Link to="/create-post">
              <button className="btn btn-primary btn-animated"><PlusIcon /> Create Post</button>
            </Link>
          </div>

          {/* ── FILTER BAR ── */}
          <div style={styles.filterBar}>
            {/* Search input */}
            <div style={styles.searchWrap}>
              <SearchIcon />
              <input
                style={styles.searchInput}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts, topics, tags..."
              />
              {search && (
                <button style={styles.clearBtn} onClick={() => setSearch("")}>✕</button>
              )}
            </div>
            {/* Department filter */}
            <select className="form-select" style={{ width: "auto", minWidth: 180 }} value={department} onChange={handleDepartmentChange}>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>

          {/* ── TYPE TABS ── */}
          <div style={styles.tabs}>
            {Object.entries(typeLabels).map(([key, label]) => (
              <button
                key={key}
                style={{ ...styles.pill, ...(type === key ? styles.pillActive[key] : styles.pillInactive) }}
                onClick={() => handleTypeChange(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── RESULTS COUNT ── */}
          <p style={styles.resultCount}>
            Showing <strong>{posts.length}</strong> of <strong>{pagination.total}</strong> {typeLabels[type].toLowerCase()}
            {search && <> matching "<em>{search}</em>"</>}
          </p>

          {/* ── POSTS GRID ── */}
          {loading ? (
            <div style={styles.grid}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{ height: 220, background: "var(--bg-light)", borderRadius: "var(--radius-md)", animation: "shimmer 1.5s infinite", backgroundSize: "200% 100%", backgroundImage: "linear-gradient(90deg, var(--bg-light) 25%, #e8edf3 50%, var(--bg-light) 75%)" }} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div style={styles.empty}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
              <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No posts found</h3>
              <p style={{ color: "var(--text-muted)" }}>Try adjusting your filters or search terms.</p>
              <Link to="/create-post" style={{ marginTop: "1rem", display: "inline-block" }}>
                <button className="btn btn-primary btn-animated">Be the first to post!</button>
              </Link>
            </div>
          ) : (
            <div className="grid-stagger" style={styles.grid}>
              {posts.map((post) => <PostCard key={post._id} post={post} />)}
            </div>
          )}

          {/* ── PAGINATION ── */}
          {pagination.pages > 1 && (
            <div style={styles.pagination}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>← Prev</button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button key={pageNum} style={{ ...styles.pageBtn, ...(page === pageNum ? styles.pageBtnActive : {}) }} onClick={() => setPage(pageNum)}>
                    {pageNum}
                  </button>
                );
              })}
              <button className="btn btn-secondary btn-sm" onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}>Next →</button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

const styles = {
  pageHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2rem 0 1.25rem", flexWrap: "wrap", gap: "1rem" },
  h1: { fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)" },
  sub: { fontSize: "0.93rem", color: "var(--text-muted)", marginTop: "0.25rem" },
  filterBar: { display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap" },
  searchWrap: { flex: 1, minWidth: 220, position: "relative", display: "flex", alignItems: "center" },
  searchInput: { width: "100%", padding: "0.6rem 2.5rem 0.6rem 2.25rem", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", fontFamily: "var(--font-base)", fontSize: "0.9rem", outline: "none", background: "var(--bg-white)" },
  clearBtn: { position: "absolute", right: "0.75rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", fontSize: "0.85rem" },
  tabs: { display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" },
  pill: { padding: "0.45rem 1.1rem", borderRadius: 20, fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", border: "none", transition: "all 0.15s" },
  pillActive: { all: { background: "var(--brand)", color: "#fff" }, project: { background: "var(--badge-project-bg)", color: "var(--badge-project-text)" }, thesis: { background: "var(--badge-thesis-bg)", color: "var(--badge-thesis-text)" }, experience: { background: "var(--badge-experience-bg)", color: "var(--badge-experience-text)" } },
  pillInactive: { background: "var(--bg-light)", color: "var(--text-muted)" },
  resultCount: { fontSize: "0.87rem", color: "var(--text-muted)", marginBottom: "1rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" },
  empty: { textAlign: "center", padding: "4rem 2rem" },
  pagination: { display: "flex", justifyContent: "center", gap: "0.4rem", marginTop: "2rem", flexWrap: "wrap", alignItems: "center" },
  pageBtn: { width: 36, height: 36, borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem", color: "var(--text-secondary)" },
  pageBtnActive: { background: "var(--brand)", color: "#fff", borderColor: "var(--brand)" },
};

const SearchIcon = () => <svg style={{ position: "absolute", left: "0.75rem", width: 16, height: 16, stroke: "var(--text-faint)" }} viewBox="0 0 24 24" fill="none" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

export default Listings;
