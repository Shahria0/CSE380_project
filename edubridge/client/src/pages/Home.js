// ============================================================
// client/src/pages/Home.js — Public Landing Page
// ============================================================
import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

const Home = () => (
  <>
    {/* ── HERO ── */}
    <section style={styles.hero}>
      <h1 className="hero-title" style={styles.heroH1}>Connect. Collaborate.<br />Create Academic Excellence.</h1>
      <p className="hero-sub" style={styles.heroP}>A dedicated platform where university students and alumni share project ideas, thesis topics, research work, and collaborate on academic endeavors.</p>
      <div className="hero-buttons" style={styles.heroBtns}>
        <Link to="/register"><button className="btn btn-primary btn-lg btn-animated"><GradIcon /> Join as Student</button></Link>
        <Link to="/register"><button className="btn btn-secondary btn-lg btn-secondary-animated"><UsersIcon /> Join as Alumni</button></Link>
      </div>
    </section>

    {/* ── HOW IT WORKS ── */}
    <section style={styles.section}>
      <h2 style={styles.sectionH2}>How It Works</h2>
      <p style={styles.sectionP}>Three simple steps to start collaborating with your university community.</p>
      <div style={styles.stepsGrid}>
        <StepCard n="1" title="Create Your Profile" desc="Sign up as a student or alumni. Share your department, skills, and academic interests." icon="👤" />
        <StepCard n="2" title="Discover & Share" desc="Browse projects, thesis topics, and experiences. Share your own ideas and research work." icon="🔍" />
        <StepCard n="3" title="Connect & Collaborate" desc="Connect with peers and mentors. Discuss ideas, get feedback, and work together." icon="🤝" />
      </div>
    </section>

    {/* ── FOR STUDENTS + ALUMNI ── */}
    <section style={{ ...styles.section, maxWidth: 1000 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <FeatureCard title="For Students" icon="🎓" features={["Find Research Partners","Get Thesis Ideas","Learn From Alumni","Build Your Portfolio"]} />
        <FeatureCard title="For Alumni" icon="💼" features={["Give Back to Your University","Stay Connected","Share Your Expertise","Discover Talent"]} />
      </div>
    </section>

    {/* ── WHAT YOU CAN SHARE ── */}
    <section style={styles.section}>
      <h2 style={styles.sectionH2}>What You Can Share</h2>
      <p style={styles.sectionP}>Multiple ways to contribute and collaborate with your academic community</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
        <ShareCard icon="💡" title="Project Ideas" desc="Share innovative project concepts and find collaborators who can bring them to life." />
        <ShareCard icon="📚" title="Thesis Topics" desc="Propose thesis topics, seek guidance, or offer mentorship to others." highlight />
        <ShareCard icon="🌟" title="Experiences" desc="Share your academic journey, research experiences, and lessons learned." />
      </div>
    </section>

    {/* ── CTA ── */}
    <section style={styles.ctaSection}>
      <h2 style={styles.ctaH2}>Ready to Start Collaborating?</h2>
      <p style={styles.ctaP}>Join students and alumni building the future of academic collaboration.</p>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link to="/register"><button className="btn-animated" style={styles.ctaBtnWhite}>Get Started Free</button></Link>
        <Link to="/login"><button className="btn-secondary-animated" style={styles.ctaBtnOutline}>Sign In</button></Link>
      </div>
    </section>

    <Footer />
  </>
);

const StepCard = ({ n, title, desc, icon }) => (
  <div style={styles.stepCard}>
    <div style={styles.stepIcon}>{icon}</div>
    <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>{n}. {title}</h3>
    <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.55 }}>{desc}</p>
  </div>
);

const FeatureCard = ({ title, icon, features }) => (
  <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.75rem" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
      <div style={{ width: 42, height: 42, background: "var(--brand)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>{icon}</div>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{title}</h3>
    </div>
    <ul style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      {features.map((f) => (
        <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div style={{ width: 20, height: 20, background: "var(--success-bg)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.7rem" }}>✓</div>
          <span style={{ fontSize: "0.88rem", fontWeight: 500 }}>{f}</span>
        </li>
      ))}
    </ul>
  </div>
);

const ShareCard = ({ icon, title, desc, highlight }) => (
  <div style={{ background: highlight ? "var(--brand)" : "#fff", border: `1px solid ${highlight ? "var(--brand)" : "var(--border)"}`, borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
    <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>{icon}</div>
    <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem", color: highlight ? "#fff" : "var(--text-primary)" }}>{title}</h3>
    <p style={{ fontSize: "0.85rem", color: highlight ? "rgba(255,255,255,0.82)" : "var(--text-muted)", lineHeight: 1.55 }}>{desc}</p>
  </div>
);

const styles = {
  hero: { textAlign: "center", padding: "6rem 1.5rem 4rem", maxWidth: 700, margin: "0 auto" },
  heroH1: { fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2, marginBottom: "1rem" },
  heroP: { fontSize: "1.05rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "2rem" },
  heroBtns: { display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" },
  section: { maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.5rem", textAlign: "center" },
  sectionH2: { fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" },
  sectionP: { color: "var(--text-muted)", marginBottom: "2.5rem" },
  stepsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" },
  stepCard: { background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.75rem 1.5rem", textAlign: "center" },
  stepIcon: { fontSize: "2rem", marginBottom: "0.75rem" },
  ctaSection: { background: "var(--brand)", textAlign: "center", padding: "4rem 1.5rem", marginTop: "2rem" },
  ctaH2: { fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem" },
  ctaP: { color: "rgba(255,255,255,0.82)", marginBottom: "2rem" },
  ctaBtnWhite: { padding: "0.75rem 1.75rem", background: "#fff", color: "var(--brand)", border: "none", borderRadius: 10, fontFamily: "var(--font-base)", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" },
  ctaBtnOutline: { padding: "0.75rem 1.75rem", background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.5)", borderRadius: 10, fontFamily: "var(--font-base)", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer" },
};

const GradIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>;
const UsersIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

export default Home;
