// ============================================================
// client/src/pages/Profile.js — User Profile Page
// ============================================================
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { usersAPI } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import Footer from "../components/Footer";

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isOwnProfile = currentUser?._id === id;

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, postsRes] = await Promise.all([
          usersAPI.getProfile(id),
          usersAPI.getUserPosts(id),
        ]);
        setProfile(profileRes.data.user);
        setPosts(postsRes.data.posts);
      } catch {
        setError("User not found.");
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>Loading profile...</div>;
  if (error || !profile) return (
    <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3rem" }}>😕</div>
        <h2 style={{ fontWeight: 700, margin: "1rem 0 0.5rem" }}>User not found</h2>
        <Link to="/listings"><button className="btn btn-primary">Browse Posts</button></Link>
      </div>
    </div>
  );

  return (
    <>
      <div className="page-content">
        <main style={{ maxWidth: 920, margin: "0 auto", padding: "0 1.5rem 4rem" }}>
          <Link to="/dashboard" style={{ display: "block", fontSize: "0.88rem", color: "var(--text-muted)", marginTop: "1.5rem", marginBottom: "1.25rem" }}>← Back</Link>

          {/* ── PROFILE CARD ── */}
          <div style={styles.profileCard}>
            <div style={styles.profileHeader}>
              <div style={styles.profileLeft}>
                <div style={styles.avatarLg}>
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </div>
                <div>
                  <h1 style={styles.name}>{profile.firstName} {profile.lastName}</h1>
                  <p style={styles.roleText}>
                    {profile.role === "alumni"
                      ? `Alumni · ${profile.alumniField || ""}${profile.alumniGradYear ? ` · Class of ${profile.alumniGradYear}` : ""}`
                      : `${profile.level || "Student"} · ${profile.department || ""}`}
                  </p>
                  <div style={styles.metaRow}>
                    {profile.currentRole && <MetaItem icon="💼" text={profile.currentRole} />}
                    {profile.graduationYear && <MetaItem icon="🎓" text={`Expected ${profile.graduationYear}`} />}
                    {profile.linkedIn && <a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)", fontSize: "0.83rem" }}>LinkedIn ↗</a>}
                  </div>
                </div>
              </div>
              {isOwnProfile && (
                <Link to="/settings">
                  <button className="btn btn-secondary btn-sm btn-secondary-animated">✏️ Edit Profile</button>
                </Link>
              )}
            </div>

            {profile.bio && <p style={styles.bio}>{profile.bio}</p>}

            {/* Skills & Interests */}
            {(profile.skills?.length > 0 || profile.interests?.length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                {profile.skills?.length > 0 && (
                  <div>
                    <h4 style={styles.chipGroupTitle}>Skills</h4>
                    <div style={styles.chips}>{profile.skills.map((s) => <span key={s} className="tag tag-animated">{s}</span>)}</div>
                  </div>
                )}
                {profile.interests?.length > 0 && (
                  <div>
                    <h4 style={styles.chipGroupTitle}>Interests</h4>
                    <div style={styles.chips}>{profile.interests.map((i) => <span key={i} className="tag tag-animated">{i}</span>)}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── TABS ── */}
          <div style={styles.tabs}>
            {["posts", "about"].map((t) => (
              <button key={t} style={{ ...styles.tabBtn, ...(tab === t ? styles.tabBtnActive : {}) }} onClick={() => setTab(t)}>
                {t === "posts" ? `Posts (${posts.length})` : "About"}
              </button>
            ))}
          </div>

          {/* ── POSTS TAB ── */}
          {tab === "posts" && (
            <div>
              {posts.length === 0 ? (
                <div style={styles.empty}>
                  {isOwnProfile ? (
                    <><p>You haven't posted anything yet.</p><Link to="/create-post"><button className="btn btn-primary" style={{ marginTop: "1rem" }}>Create your first post</button></Link></>
                  ) : (
                    <p>This user hasn't posted anything yet.</p>
                  )}
                </div>
              ) : (
                <div style={styles.postsGrid}>
                  {posts.map((p) => <PostCard key={p._id} post={p} />)}
                </div>
              )}
            </div>
          )}

          {/* ── ABOUT TAB ── */}
          {tab === "about" && (
            <div style={styles.aboutGrid}>
              <AboutRow label="Full Name" value={`${profile.firstName} ${profile.lastName}`} />
              <AboutRow label="Role" value={profile.role === "alumni" ? "Alumni" : "Student"} />
              {profile.department && <AboutRow label="Department" value={profile.department} />}
              {profile.level && <AboutRow label="Level" value={profile.level} />}
              {profile.graduationYear && <AboutRow label="Expected Graduation" value={profile.graduationYear} />}
              {profile.alumniGradYear && <AboutRow label="Graduation Year" value={profile.alumniGradYear} />}
              {profile.alumniField && <AboutRow label="Field" value={profile.alumniField} />}
              {profile.currentRole && <AboutRow label="Current Role" value={profile.currentRole} />}
              {profile.linkedIn && <AboutRow label="LinkedIn" value={<a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)" }}>{profile.linkedIn}</a>} />}
              {profile.github && <AboutRow label="GitHub" value={<a href={profile.github} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)" }}>{profile.github}</a>} />}
              <AboutRow label="Member Since" value={new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })} />
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
};

const MetaItem = ({ icon, text }) => (
  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.83rem", color: "var(--text-muted)" }}>{icon} {text}</span>
);

const AboutRow = ({ label, value }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
    <span style={{ fontSize: "0.93rem", color: "var(--text-primary)" }}>{value}</span>
  </div>
);

const styles = {
  profileCard: { background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "1.75rem 2rem", marginBottom: "1.5rem" },
  profileHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem" },
  profileLeft: { display: "flex", alignItems: "flex-start", gap: "1.25rem" },
  avatarLg: { width: 80, height: 80, background: "var(--brand-100)", borderRadius: "50%", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700, color: "var(--brand)", flexShrink: 0 },
  name: { fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.2rem" },
  roleText: { fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "0.5rem" },
  metaRow: { display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" },
  bio: { fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: "1.25rem" },
  chipGroupTitle: { fontSize: "0.88rem", fontWeight: 700, marginBottom: "0.6rem" },
  chips: { display: "flex", flexWrap: "wrap", gap: "0.4rem" },
  tabs: { display: "flex", borderBottom: "2px solid var(--border)", marginBottom: "1.25rem" },
  tabBtn: { padding: "0.75rem 1.1rem", fontSize: "0.93rem", fontWeight: 600, color: "var(--text-muted)", background: "none", border: "none", borderBottom: "2px solid transparent", marginBottom: -2, cursor: "pointer" },
  tabBtnActive: { color: "var(--brand)", borderBottomColor: "var(--brand)" },
  postsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  empty: { background: "var(--bg-light)", borderRadius: "var(--radius-md)", padding: "3rem", textAlign: "center", color: "var(--text-muted)" },
  aboutGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "1.75rem 2rem" },
};

export default Profile;
