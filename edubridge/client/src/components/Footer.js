// client/src/components/Footer.js
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer style={styles.footer}>
    <div style={styles.inner}>
      <div style={styles.grid}>
        <div style={styles.brandCol}>
          <div style={styles.brandRow}>
            <div style={styles.logo}>
              <svg viewBox="0 0 24 24" fill="#fff" width="17" height="17">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm-7 9.18V16l7 3.82 7-3.82v-3.82L12 16l-7-3.82z" />
              </svg>
            </div>
            <span style={styles.brandName}>EduBridge</span>
          </div>
          <p style={styles.desc}>Connecting students and alumni for academic collaboration and knowledge sharing.</p>
        </div>
        <FooterCol title="Platform" links={[{ label: "How it Works", to: "/" }, { label: "For Students", to: "/register" }, { label: "For Alumni", to: "/register" }]} />
        <FooterCol title="Resources" links={[{ label: "Browse Projects", to: "/listings" }, { label: "Alumni Stories", to: "/alumni" }, { label: "Community Guidelines", to: "/" }]} />
        <FooterCol title="Account" links={[{ label: "Sign In", to: "/login" }, { label: "Register", to: "/register" }, { label: "Dashboard", to: "/dashboard" }]} />
      </div>
      <div style={styles.bottom}>&copy; {new Date().getFullYear()} EduBridge. All rights reserved.</div>
    </div>
  </footer>
);

const FooterCol = ({ title, links }) => (
  <div>
    <h4 style={styles.colTitle}>{title}</h4>
    <ul style={styles.colLinks}>
      {links.map((l) => (
        <li key={l.label}><Link to={l.to} className="footer-link-animated" style={styles.colLink}>{l.label}</Link></li>
      ))}
    </ul>
  </div>
);

const styles = {
  footer: { background: "var(--bg-white)", borderTop: "1px solid var(--border)", marginTop: "2rem" },
  inner: { maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem 1.5rem" },
  grid: { display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "2rem", marginBottom: "1.5rem", flexWrap: "wrap" },
  brandCol: { maxWidth: 240 },
  brandRow: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" },
  logo: { width: 30, height: 30, background: "var(--brand)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: "1rem", fontWeight: 700 },
  desc: { fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 },
  colTitle: { fontSize: "0.88rem", fontWeight: 700, marginBottom: "0.75rem" },
  colLinks: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  colLink: { fontSize: "0.84rem", color: "var(--text-muted)", transition: "color 0.15s" },
  bottom: { textAlign: "center", fontSize: "0.82rem", color: "var(--text-faint)", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" },
};

export default Footer;
